import { useAuth } from '@/contexts/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Alert, SafeAreaView, ScrollView } from 'react-native'

import { Button, ButtonText } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { Text } from '@/components/ui/text'
import { VStack } from '@/components/ui/vstack'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut()
            } catch (error) {
              Alert.alert('Error', 'Failed to logout')
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <VStack space="lg">
          {/* Header Section */}
          <VStack 
            space="md" 
            className="items-center bg-white rounded-2xl p-6 shadow-sm"
          >
            {/* Avatar */}
            <VStack className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center mb-4">
              <Ionicons name="person" size={40} color="#666" />
            </VStack>
            
            <Heading size="xl" className="text-gray-900 text-center">
              Welcome!
            </Heading>
            <Text size="md" className="text-gray-600 text-center">
              {user?.email}
            </Text>
          </VStack>

          {/* Account Information Section */}
          <VStack 
            space="md" 
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <Heading size="lg" className="text-gray-900 mb-4">
              Account Information
            </Heading>
            
            {/* Email */}
            <HStack className="items-center py-3 border-b border-gray-100">
              <VStack className="w-10 items-center justify-center mr-3">
                <Ionicons name="mail-outline" size={20} color="#666" />
              </VStack>
              <VStack className="flex-1">
                <Text size="sm" className="text-gray-600">Email</Text>
                <Text size="md" className="text-gray-900 font-medium">
                  {user?.email}
                </Text>
              </VStack>
            </HStack>

            {/* Member Since */}
            <HStack className="items-center py-3 border-b border-gray-100">
              <VStack className="w-10 items-center justify-center mr-3">
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </VStack>
              <VStack className="flex-1">
                <Text size="sm" className="text-gray-600">Member Since</Text>
                <Text size="md" className="text-gray-900 font-medium">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </Text>
              </VStack>
            </HStack>

            {/* Email Verified */}
            <HStack className="items-center py-3">
              <VStack className="w-10 items-center justify-center mr-3">
                <Ionicons name="checkmark-circle-outline" size={20} color="#666" />
              </VStack>
              <VStack className="flex-1">
                <Text size="sm" className="text-gray-600">Email Verified</Text>
                <Text 
                  size="md" 
                  className={`font-medium ${
                    user?.email_confirmed_at ? 'text-green-600' : 'text-yellow-600'
                  }`}
                >
                  {user?.email_confirmed_at ? 'Verified' : 'Not Verified'}
                </Text>
              </VStack>
            </HStack>
          </VStack>

          {/* Learning Progress Section */}
          <VStack 
            space="md" 
            className="bg-white rounded-2xl p-5 shadow-sm"
          >
            <Heading size="lg" className="text-gray-900 mb-4">
              Learning Progress
            </Heading>
            
            <VStack space="md" className="items-center">
              <Heading size="lg" className="text-gray-900 text-center">
                Your YuYin Journey
              </Heading>
              <Text size="sm" className="text-gray-600 text-center mb-5">
                Start practicing to see your progress!
              </Text>
              
              <HStack space="xl" className="justify-around w-full">
                <VStack className="items-center">
                  <Text size="2xl" className="text-red-600 font-bold mb-1">
                    0
                  </Text>
                  <Text size="sm" className="text-gray-600">
                    Lessons
                  </Text>
                </VStack>
                
                <VStack className="items-center">
                  <Text size="2xl" className="text-red-600 font-bold mb-1">
                    0
                  </Text>
                  <Text size="sm" className="text-gray-600">
                    Streak
                  </Text>
                </VStack>
                
                <VStack className="items-center">
                  <Text size="2xl" className="text-red-600 font-bold mb-1">
                    0
                  </Text>
                  <Text size="sm" className="text-gray-600">
                    XP
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </VStack>

          {/* Logout Button */}
          <Button
            size="lg"
            action="negative"
            className="bg-red-600 mt-5"
            onPress={handleLogout}
          >
            <HStack space="sm" className="items-center">
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <ButtonText className="text-white font-semibold">
                Logout
              </ButtonText>
            </HStack>
          </Button>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  )
} 