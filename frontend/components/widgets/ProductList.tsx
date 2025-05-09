import { FlatList } from "react-native";
import ProductListItem from "@/components/widgets/ProductListItem";
import { useMediaQuery } from "@/components/ui/utils/use-media-query";


export default function ProductList({page, data, onEndReached}) {

    const [one, two, three, four, five] = useMediaQuery([
        {
          maxWidth: 500,
        },
        {
          minWidth: 500,
          maxWidth: 750,
        },
        {
            minWidth: 750,
            maxWidth: 1000,
        },
        {
            minWidth: 1000,
            maxWidth: 1250,
        },
        {
          minWidth: 1250,
        },
    ])

    var numColumns = 0;
    if(one) 
        numColumns = 1;
    else if(two)
        numColumns = 2;
    else if(three)
        numColumns = 3;
    else if(four)
        numColumns = 4;
    else if(five)
        numColumns = 5;

    if(page == "search")
        numColumns -= 1;

    return (
        <>
        {
            numColumns == 1 ? 
            <FlatList 
                key={numColumns}
                data={data}
                renderItem={({item}) => (
                    <ProductListItem product={item}/>
                )}
                contentContainerClassName="gap-2"
                horizontal={false}
                onEndReached={onEndReached}
                onEndReachedThreshold={0}
            />
            
            :
            <FlatList 
                keyExtractor={(item) => item.id}
                key={numColumns}
                data={data}
                renderItem={({item}) => (
                    <ProductListItem product={item}/>
                )}
                numColumns={numColumns}
                contentContainerClassName="gap-2"
                columnWrapperClassName="gap-2"
                onEndReached={onEndReached}
                onEndReachedThreshold={0.2}
                style={{height: "120vh"}}
            />

        }
       </>
    )
}