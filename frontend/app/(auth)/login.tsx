import { Button, ButtonText } from "../../components/ui/button";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icon";
import React, { useState } from "react";
import { HStack } from "@/components/ui/hstack";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/api/auth";
import { useAuth } from "@/providers/AuthProvider";
import { Redirect } from "expo-router";
import { ScrollView } from "react-native";
import Loader from "@/components/widgets/Loader";

	
export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signin, user, isLoading} = useAuth();

  const loginMutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: async (data) => {

      await signin(data);
    },
    onError: (e) => {

      console.log("error: "+e);
    }
  })
  
  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

  if(isLoading) {
    return ( <Loader /> );
  }

  if(user)
    return (<Redirect href="/"/>);

  return (
    <ScrollView>
      <FormControl className="p-4 border rounded-lg border-outline-300 max-w-[600px] mx-auto mt-5">
        <VStack space="xl">
          <Heading className="text-typography-900">Login</Heading>
          <VStack space="xs">
            <Text className="text-typography-500">Email</Text>
            <Input className="min-w-[250px]">
              <InputField value={email} onChangeText={setEmail} type="text" />
            </Input>
          </VStack>
          <VStack space="xs">
            <Text className="text-typography-500">Password</Text>
            <Input className="text-center">
              <InputField type={showPassword ? "text" : "password"} value={password} onChangeText={setPassword}  />
              <InputSlot className="pr-3" onPress={handleState}>
                <InputIcon
                  as={showPassword ? EyeIcon : EyeOffIcon}
                />
              </InputSlot>
            </Input>
          </VStack>
          <HStack space="sm">
            <Button className="flex-1" onPress={() => {}}>
              <ButtonText className="text-typography-0">Sign Up</ButtonText>
            </Button>
            <Button className="flex-1" onPress={() => loginMutation.mutate()}>
              <ButtonText className="text-typography-0">Sign In</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </FormControl>
    </ScrollView>
   
  );
}