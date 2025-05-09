import React from "react";
import { Stack } from "expo-router";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/providers/AuthProvider";

import Header from "@/components/header/Header";

const queryClient = new QueryClient();

export default function RootLayout() {

    return (
        <AuthProvider>
            <QueryClientProvider client={queryClient}>
                <GluestackUIProvider>
                    <Header/>
                    <Stack
                        screenOptions={{headerShown: false}}
                    >
                    
                    </Stack>
                </GluestackUIProvider>
            </QueryClientProvider>
        </AuthProvider>
    )
}