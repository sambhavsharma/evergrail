import { useState, useEffect } from "react";
import {  ScrollView, StyleSheet } from "react-native";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { FormControl, 
    FormControlLabel, 
    FormControlLabelText, 
 } from "@/components/ui/form-control";
    
import { Input, InputField } from "@/components/ui/input";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Center } from "@/components/ui/center";
import { Heading } from "@/components/ui/heading";
import { Box } from "@/components/ui/box";
import { Image } from "@/components/ui/image";

import { authCheck } from "@/api/auth";

import {
    Select,
    SelectTrigger,
    SelectInput,
    SelectIcon,
    SelectPortal,
    SelectBackdrop,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

import { AddIcon, ChevronDownIcon } from "@/components/ui/icon";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation } from "@tanstack/react-query";
import { listCategories } from "@/api/categories";
import { createProduct } from "@/api/products";

import CategorySelect from "@/components/sell/CategorySelect";
import BrandSelect from "@/components/sell/BrandSelect";
import ProductCreated from "@/components/sell/ProductCreated";
import { useAuth } from "@/providers/AuthProvider";
import { Redirect } from "expo-router";
import Loader from "@/components/widgets/Loader";

export default function Sell () {

    const [createdProduct, setCreatedProduct] = useState(null);
    const {logout, user, isLoading} = useAuth();

    const {data: authCheckData, error: authCheckError} = useQuery({
        queryKey: ['auth' ], 
        queryFn: authCheck,
        retry: false
    });

    // Form Values
    const [formData, setFormData] = useState({});
    const [selectedCategory, setSelectedCategory] = useState({});
    const [attributes, setAttributes] = useState({});

    useEffect(
        () => {
            const handleAuthCheckError = async () => {

                if(authCheckError && authCheckError.status === 401){
                    await logout();
                    return <Redirect href="/login"/>;
                }
            }

            handleAuthCheckError();
        }, [authCheckError]
    )
    
    const handleSubmit = async (status: string) => {

        let media = [];

        for (let image of formData.media) {
            let imageObj = {
                fileName: image.fileName,
                mimeType: image.mimeType,
                type: "image",
                uri: image.base64
            };
            
            media.push(imageObj);
        }

        const product = {
            ...formData,
            currency: "INR",
            category_id: selectedCategory.id,
            status: status,
            media: media
        }

        createProductMutation.mutate({ media, product});
    };

    const attributesUpdate = (attribute_id: number, value: string) => {

        attributes[attribute_id] = value
        setAttributes(attributes);
    }

    const {data} = useQuery({queryKey: ['categories'], queryFn:() => listCategories()});

    const createProductMutation = useMutation({
        mutationFn: (productObj: object) => {
            return createProduct(productObj)
        },
        onSuccess: (data) => {
            if(data.id)
                setCreatedProduct(data);
        },
        onError: async (err) => {
            if(err.status === 401){
                await logout();
                return <Redirect href="/login"/>;
            }
        }
    })

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images','videos'],
            allowsEditing: false,
            aspect: [4, 3],
            quality: 1,
            allowsMultipleSelection: true,
            base64: true,
        });
    
        if (!result.canceled) {
            setFormData({
                ...formData,
                media: result.assets
            })
        }
    };

    const resetPage = () => {
        setCreatedProduct(null);
        setFormData({});
    }

    if(isLoading) {
        return ( <Loader /> );
    }

    if(!user){
        return <Redirect href="/login"/>
    }

    return (
        <ScrollView>
            <Center>

                { createdProduct && <ProductCreated createdProduct={createdProduct} resetPage={resetPage} />}

                { !createdProduct &&
                    <VStack  space="lg" className="w-full max-w-[800px] rounded-md border-background-200 p-4">
                        <Heading>
                            Sell your product
                        </Heading>
                        <FormControl isInvalid={false} size="md" isDisabled={false} isReadOnly={false} isRequired={false} >
                        
                        {/* Item Name */}
                        <HStack className="w-full mt-[20px] z-[-1]">
                            <Box>
                                <VStack space="xs">
                                    <FormControlLabel>
                                        <FormControlLabelText>Item Name</FormControlLabelText>
                                    </FormControlLabel>
                                    <Input className="min-w-[250px]">
                                        <InputField type="text" value={formData.name} 
                                            onChangeText = {(text)=> {
                                                setFormData({
                                                    ...formData,
                                                    name: text
                                                })
                                            }}  
                                        />
                                    </Input>
                                </VStack>
                            </Box>
                        </HStack>

                        {/* Item Description */}
                        <VStack space="xs" className="mt-[20px] z-[-1]">
                            <FormControlLabel>
                                <FormControlLabelText>Description</FormControlLabelText>
                            </FormControlLabel>
                            <Textarea
                                size="md"
                                isReadOnly={false}
                                isInvalid={false}
                                isDisabled={false}
                                className="w-full"
                            >
                                <TextareaInput placeholder="Your text goes here..." 
                                    value={formData.description} 
                                    onChangeText = {(text)=> 
                                        setFormData({
                                            ...formData,
                                            description: text
                                        })
                                    } 
                                />
                            </Textarea>
                        </VStack>

                        {/* Item Brand Select */}
                        <BrandSelect 
                            formData={formData} 
                            setFormData={setFormData} 
                        />

                        {/* Condition Select */}
                        <HStack className="w-full mt-[20px] z-[-1]">
                            <Box>
                                <VStack space="xs">
                                    <FormControlLabel>
                                        <FormControlLabelText>Condition</FormControlLabelText>
                                    </FormControlLabel>
                                    <Select 
                                        selectedValue={formData.condition}
                                        onValueChange={(value) => {
                                            setFormData({
                                                ...formData,
                                                condition: value
                                            })
                                        }}
                                    >
                                        <SelectTrigger variant="outline" size="md">
                                            <SelectInput placeholder="Select Condition" />
                                            <SelectIcon className="mr-3" as={ChevronDownIcon} />
                                        </SelectTrigger>
                                        <SelectPortal>
                                            <SelectBackdrop />
                                            <SelectContent>
                                                <SelectItem label="New" value="new" />
                                                <SelectItem label="Like New" value="like_new" />
                                                <SelectItem label="Used" value="used" />
                                            </SelectContent>
                                        </SelectPortal>
                                    </Select>
                                </VStack>
                            </Box>
                        </HStack>

                        <CategorySelect data={data} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
                        
                        {/* Attributes Select */}
                        {
                            selectedCategory && selectedCategory.attributes && 
                            selectedCategory.attributes.map((attribute: any) => {
                                return (
                                    <>
                                        <HStack className="w-full mt-[20px] z-[-1]">
                                            <Box>
                                                <VStack space="xs">
                                                    <FormControlLabel>
                                                        <FormControlLabelText>
                                                            {attribute.name}
                                                        </FormControlLabelText>
                                                    </FormControlLabel>
                                                    <Select onValueChange={(value) => {attributesUpdate(attribute.id, value)}}>
                                                        <SelectTrigger variant="outline" size="md">
                                                            <SelectInput placeholder={`Select ${attribute.name}`} />
                                                            <SelectIcon className="mr-3" as={ChevronDownIcon} />
                                                        </SelectTrigger>
                                                        <SelectPortal>
                                                            <SelectBackdrop />
                                                            <SelectContent>
                                                                {
                                                                    attribute.values.map((value) => {
                                                                        return (
                                                                            <SelectItem label={value} value={value} />
                                                                        );
                                                                    })
                                                                }
                                                            </SelectContent>
                                                        </SelectPortal>
                                                    </Select>
                                                </VStack>
                                            </Box>
                                            <Box>
                                            </Box>
                                        </HStack>
                                    </>
                                );
                            })
                        }
                        
                        {/* Item Price */}
                        <HStack className="w-full mt-[20px] z-[-1]">
                            <Box>
                                <VStack space="xs">
                                <FormControlLabel>
                                    <FormControlLabelText>Price (In Rupees)</FormControlLabelText>
                                </FormControlLabel>
                                <Input className="min-w-[250px]">
                                    <InputField type="text" value={formData.price} 
                                        onChangeText = {(text)=> 
                                            setFormData({
                                                ...formData,
                                                price: text.replace(/[^0-9]/g, '')
                                            })
                                        }
                                    />
                                </Input>
                                </VStack>
                            </Box>
                        </HStack>   

                        {/* Image Upload */}
                        <HStack space="lg" className="w-full mt-[20px] z-[-1]">
                            <Box>
                                <Button className="mt-2" onPress={pickImage}>
                                    <ButtonText>Add Image</ButtonText>
                                    <ButtonIcon as={AddIcon} className="ml-2" />
                                </Button>
                            </Box>
                            <Box>
                                <HStack space="md">
                                    {
                                        formData.media && formData.media.map((img: any) => {
                                            return (
                                                <Image key={img.id} source={{ uri: img.url || img.uri }} style={styles.image} />
                                            );
                                        })
                                    }
                                </HStack>
                            </Box>
                        </HStack>
                        
                        </FormControl>

                        <HStack className="mt-[20px] z-[-1]" space="md">
                            <Button className="w-fit self-end mt-4" size="sm" 
                                onPress= {() => {handleSubmit("draft")}}
                            >
                                <ButtonText>Save Draft</ButtonText>
                            </Button>
                            <Button className="w-fit self-end mt-4" size="sm" 
                                onPress= {() => {handleSubmit("live")}}
                            >
                                <ButtonText> Publish </ButtonText>
                            </Button>
                        </HStack>
                        
                    </VStack>
                }
            </Center>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        width: 400,
        height: 400,
    },
});