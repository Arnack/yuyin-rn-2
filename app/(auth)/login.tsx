import { useAuth } from '@/contexts/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { Link, router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'

import { Button, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signIn } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { error } = await signIn(email, password)
      if (error) {
        Alert.alert('Login Failed', error.message)
      } else {
        router.replace('/(tabs)')
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <VStack space="xl" className="flex-1 justify-center">
          {/* Header */}
          <VStack space="sm" className="items-center mb-10">
            <Heading size="3xl" className="text-gray-900 text-center">
              Welcome to YuYin
            </Heading>
            <Text size="md" className="text-gray-600 text-center">
              Sign in to continue your Chinese learning journey
            </Text>
          </VStack>

          {/* Form */}
          <VStack space="lg">
            {/* Email Input */}
            <VStack space="xs">
              <Text size="sm" className="text-gray-700 font-medium">Email</Text>
              <Input className="border border-gray-300 bg-gray-50">
                <InputSlot className="pl-3">
                  <InputIcon>
                    <Ionicons name="mail-outline" size={20} color="#666" />
                  </InputIcon>
                </InputSlot>
                <InputField
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Input>
            </VStack>

            {/* Password Input */}
            <VStack space="xs">
              <Text size="sm" className="text-gray-700 font-medium">Password</Text>
              <Input className="border border-gray-300 bg-gray-50">
                <InputSlot className="pl-3">
                  <InputIcon>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" />
                  </InputIcon>
                </InputSlot>
                <InputField
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <InputSlot className="pr-3" onPress={() => setShowPassword(!showPassword)}>
                  <InputIcon>
                    <Ionicons 
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                      size={20} 
                      color="#666" 
                    />
                  </InputIcon>
                </InputSlot>
              </Input>
            </VStack>

            {/* Login Button */}
            <Button
              size="lg"
              action="primary"
              className="bg-red-600 mt-4"
              onPress={handleLogin}
              isDisabled={loading}
            >
              <ButtonText className="text-white font-semibold">
                {loading ? 'Signing In...' : 'Sign In'}
              </ButtonText>
            </Button>

            {/* Divider */}
            <HStack className="items-center my-6">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="mx-4 text-gray-600">or</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </HStack>

            {/* Sign Up Link */}
            <HStack className="justify-center items-center">
              <Text className="text-gray-600">Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <Button variant="link" size="sm" className="p-0">
                  <ButtonText className="text-red-600 font-semibold">Sign Up</ButtonText>
                </Button>
              </Link>
            </HStack>
          </VStack>
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
} 