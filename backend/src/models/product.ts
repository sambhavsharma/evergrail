
import { db } from "../db";
import { productsTable } from "../db/products";
import { categoriesTable } from "../db/categories";
import { brandsTable } from "../db/brands";
import {  eq, and, count, inArray } from "drizzle-orm";
import { PRODUCT_CONDITIONS, DEFAULT_LIMIT } from "../lib/constants";
import fs from 'fs';


const ProductSerializer = require("../serializers/products");
const CategoriesSerializer = require("../serializers/categories");
const Media = require("../models/media");
const Brand = require("../models/brand");
const ProductAttribute = require("../models/product_attribute");
const Storage = require("../lib/multer-config");

const BASE_URL = "http://127.0.0.1:3000/";

export async function create(product: any, user_id: number) {

    try {

        const {productRow, error} = await db.transaction(async (tx) => { 

            product.seller_id = user_id;
            var [productRow] = await tx.insert(productsTable)
                .values(product)
                .returning();
    
            // Adding Product Media
            productRow.media = [];
            
            for (var media of product.media || []) {
    
                if(!media.url){
                    let buff = Buffer.from(media.uri, 'base64');
                    fs.writeFileSync('./media/'+media.fileNname, buff);
                }
                    
                var mediaObj = {
                    parent_type: "product",
                    parent_id: productRow.id.toString(),
                    type: media.type,
                    url: media.url ? media.url : BASE_URL+media.fileNname
                }
    
                productRow.media.push(mediaObj);
    
                const {error} = await Media.create(mediaObj, tx);
                
                if (error) {
                    tx.rollback();  
                    return {error};
                }
            }
    
            // Adding Product Attributes
            for (var attribute_id of Object.keys(product.attributes || {})) {
                let attribute = {
                    product_id: productRow.id,
                    attribute_id: parseInt(attribute_id),
                    value: product.attributes[attribute_id]
                }
    
                const {error} = await ProductAttribute.create(attribute, tx);
    
                if (error) {

                    tx.rollback();  
                    return {error};
                }
            }
    
            return {productRow: productRow};
        });
    
        return ProductSerializer.productObj(productRow);

    } catch (error) {

        //console.log(error);
        return {error: error};
    }
        
    

};

export async function get(id: number) {

    const product = await db.query.productsTable.findFirst({
        where: and(
            eq(productsTable.id, id),
            eq(productsTable.is_deleted, false)
        ),
        with: { 
            media: {
                where: (media, { eq }) => eq(media.parent_type, "product")
            },
            category: true,
            attributes: {
                with: {
                    attribute: true
                }
            },
            seller: {
                with: {
                    media: {
                        where: (media, { eq }) => eq(media.parent_type, "user")
                    }
                }
            },
            brand: true
        }
    });
        
    return ProductSerializer.productObj(product);
}

export async function list(page: number, limit: number, offset: number, filters)  {

    const filteredProductIds = await getFilteredProductIds(page, limit, offset, filters);

    const whereQuery = {
        where: and(
            inArray(productsTable.id, filteredProductIds)
        )
    }

    const products = await db.query.productsTable.findMany({
        ...whereQuery,
        with: { 
            media: {
                where: (media, { eq }) => eq(media.parent_type, "product")
            },
            category: true,
            seller: {
                with: {
                    media: {
                        where: (media, { eq }) => eq(media.parent_type, "user")
                    }
                }
            },
            attributes: {
                with: {
                    attribute: true
                }
            },
            brand: true
        }
    });

    const count = await db.$count(productsTable, whereQuery.where);
    const nextPage = (count - (page * limit)) > 0 ? page+1 : null
    
    return {
        filters: await buildAvailableFilters(filters),
        products: ProductSerializer.productsList(products),
        count: count,
        nextPage: nextPage
    };
}

export async function update(id: number, updateFields: any, user_id: number) {
     
    try {
        
        const {productRow, error} = await db.transaction(async (tx) => { 

            var [productRow] = await tx.update(productsTable)
                .set(updateFields.product)
                .where(and(
                    eq(productsTable.id, id),
                    eq(productsTable.is_deleted, false),
                    eq(productsTable.seller_id, user_id)
                ))
                .returning();
    
            return {productRow: productRow};
        });
    
        return ProductSerializer.productObj(productRow);

    } catch (error) {

        return {error: error};
    }
};

export async function deleteProduct(id: number, user_id: number) {
     
    try {
        
        const {productRow, error} = await db.transaction(async (tx) => { 

            var [productRow] = await tx.update(productsTable)
                .set({
                    is_deleted: true
                })
                .where(and(
                    eq(productsTable.id, id),
                    eq(productsTable.seller_id, user_id)
                ))
                .returning();
    
            return {productRow: productRow};
        });

        return ProductSerializer.productObj(productRow);

    } catch (error) {
        // console.log(error);
        return {error: error};
    }

    
};

export async function getUserProducts(limit: number, offset: number, user_id, returnDraft)  {

    const products = await db.query.productsTable.findMany({
        where: and(
            eq(productsTable.is_deleted, false),
            eq(productsTable.seller_id, user_id),
            returnDraft ? eq(1,1) : eq(productsTable.status, "live")
        ),
        limit: limit,
        offset: offset,
        with: { 
            media: {
                where: (media, { eq }) => eq(media.parent_type, "product")
            },
            category: true,
            seller: {
                with: {
                    media: {
                        where: (media, { eq }) => eq(media.parent_type, "user")
                    }
                }
            },
            attributes: {
                with: {
                    attribute: true
                }
            }
        }
    });

    return ProductSerializer.productsList(products);
}

async function buildAvailableFilters(filters) {

    const whereQuery = (
        eq(productsTable.status, "live"),
        eq(productsTable.is_deleted, false)
    )

    const conditionFilter = await db.select({
        name: productsTable.condition,
        count: count()
    })
    .from(productsTable)
    .where(whereQuery)
    .groupBy([productsTable.condition])
    .orderBy(productsTable.condition)

    const brandFilter = await db.select({
        name: brandsTable.name,
        count: count()
    }).from(productsTable)
    .leftJoin(brandsTable, eq(productsTable.brand_id, brandsTable.id))
    .where(whereQuery)
    .groupBy([brandsTable.name])
    .orderBy(brandsTable.name)
    
    return {
        brand: brandFilter,
        condition: conditionFilter
    };

}

async function getFilteredProductIds(page: number, limit: number, offset: number, filters) {

    const filterQuery: SQL[] = [
        eq(productsTable.status, "live"),
        eq(productsTable.is_deleted, false)
    ];

    if (filters.brand) filterQuery.push(inArray(brandsTable.name, filters.brand.split(',')));
    if (filters.condition) filterQuery.push(inArray(productsTable.condition, filters.condition.split(',')));

    const filteredProductIds = await db.select({id: productsTable.id}).from(productsTable)
        .leftJoin(brandsTable, eq(productsTable.brand_id, brandsTable.id))
        .where(and(...filterQuery))
        .limit(limit).offset(offset);

    return filteredProductIds.map((obj) => obj.id);
}

export const conditionMap = {
    "N": "New",
    "LN": "Like New",
    "GU": "Gently Used"
};
