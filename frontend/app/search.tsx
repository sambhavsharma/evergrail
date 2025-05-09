import { useState, useEffect, useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { ScrollView, View } from "react-native";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import {Center } from '@/components/ui/center';
import ProductList from "@/components/widgets/ProductList";
import WebSidebar from "@/components/search/WebSidebar";
import Loader from "@/components/widgets/Loader";

import { listProducts } from "@/api/products";

export default function Search() {

    const [page, setPage] = useState(1);
    const [products, setProducts] = useState([]);

    // We should not have to do this!!!
    const [filters, setFilters] = useState({brand: [], condition: []});
    const [filterQuery, setFilterQuery] = useState({
        brand: [],
        condition: []
    });

    const listProductsCall = async ({ pageParam }) => {
        return listProducts(filterQuery, pageParam);
    }

    const {data, isFetching, isFetchingNextPage, refetch, fetchNextPage, hasNextPage} = useInfiniteQuery({
        retry: false,
        queryKey: ["products"], 
        initialPageParam: 1,
        queryFn: listProductsCall,
        getNextPageParam: (lastPage) => lastPage.nextPage,
    });

    const fetchNext = () => {
        //alert('fetch next!');
        if (!isFetchingNextPage && hasNextPage) {
            fetchNextPage();
        }
    }

    useEffect(
        () => {

            const setProductData = () => {
                let all_products = [];
                let first_page = data.pages[0];

                for(let page of data.pages) {
                    all_products.push(...page.products);
                }
                
                setProducts(all_products);
                setFilters(first_page.filters);                
            }

            if(data && data.pages)
                setProductData();

        }, [data]
    )

    if(!data) {
        return ( <Loader /> );
    }

    return (
        // <ScrollView className="px-12" >
        <View className="px-12" style={{flex:1}} >
            <HStack className="w-full md:flex flex-1">
                <Box className="max-w-[300px] w-full">
                    <WebSidebar refetch={refetch} filterQuery={filterQuery} setFilterQuery={setFilterQuery} 
                        filters={filters}/>
                </Box>
                <Box>
                    <Center>
                        <ProductList data={products} page="search" onEndReached={fetchNext}/>
                        {isFetching && <Loader /> }
                    </Center>
                </Box>
            </HStack>
            
        </View>
        // </ScrollView>
    )
}