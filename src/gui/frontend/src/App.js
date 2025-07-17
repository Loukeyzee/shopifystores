import React, { useState } from 'react';
import { ChakraProvider, Box, VStack, HStack, Button, Text, useToast, extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#f7fafc',
      500: '#667eea',
      900: '#764ba2',
    },
  },
});

function App() {
  const [wallets, setWallets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const generateWallets = async () => {
    setIsLoading(true);
    
    // Simulate wallet generation
    setTimeout(() => {
      const newWallets = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        address: `${Math.random().toString(36).substr(2, 9)}`,
        balance: 0
      }));
      
      setWallets(newWallets);
      setIsLoading(false);
      
      toast({
        title: '🎉 Wallets Generated!',
        description: `Successfully generated ${newWallets.length} secure wallets`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }, 2000);
  };

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg="gray.900" p={8}>
        <VStack spacing={8} maxW="1200px" mx="auto">
          {/* Header */}
          <VStack spacing={4} textAlign="center">
            <Text fontSize="6xl">🔐</Text>
            <Text fontSize="4xl" fontWeight="bold" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
              Solana Launch Suite
            </Text>
            <Text fontSize="xl" color="gray.400">
              Secure Wallet Generator & Launch Trading Manager
            </Text>
          </VStack>

          {/* Features */}
          <HStack spacing={8} flexWrap="wrap" justify="center">
            {[
              { icon: '🛡️', title: '100% Secure', desc: 'Local generation' },
              { icon: '💻', title: 'Cross-Platform', desc: 'Windows/Mac/Linux' },
              { icon: '🚀', title: 'Launch Trading', desc: 'Coordinated buys' },
              { icon: '📖', title: 'Complete Guide', desc: 'PDF manual included' }
            ].map((feature, index) => (
              <VStack key={index} p={6} bg="gray.800" rounded="lg" textAlign="center" minW="200px">
                <Text fontSize="3xl">{feature.icon}</Text>
                <Text fontWeight="bold">{feature.title}</Text>
                <Text fontSize="sm" color="gray.400">{feature.desc}</Text>
              </VStack>
            ))}
          </HStack>

          {/* Wallet Generator */}
          <VStack spacing={6} w="full" maxW="600px">
            <Text fontSize="2xl" fontWeight="bold">Generate Secure Wallets</Text>
            
            <Button
              size="lg"
              colorScheme="blue"
              isLoading={isLoading}
              loadingText="Generating..."
              onClick={generateWallets}
              w="full"
            >
              Generate Launch Wallets
            </Button>

            {wallets.length > 0 && (
              <VStack spacing={3} w="full">
                <Text fontSize="lg" fontWeight="bold" color="green.400">
                  ✅ {wallets.length} Wallets Generated Successfully!
                </Text>
                
                <Box p={4} bg="gray.800" rounded="lg" w="full">
                  <Text fontSize="sm" color="gray.400" mb={2}>
                    Generated Wallet Addresses:
                  </Text>
                  {wallets.slice(0, 3).map((wallet) => (
                    <Text key={wallet.id} fontSize="xs" fontFamily="mono" color="gray.300">
                      Wallet {wallet.id}: {wallet.address}...
                    </Text>
                  ))}
                  {wallets.length > 3 && (
                    <Text fontSize="xs" color="gray.500">
                      + {wallets.length - 3} more wallets...
                    </Text>
                  )}
                </Box>

                <Text fontSize="sm" color="yellow.400" textAlign="center">
                  ⚠️ In the real application, these would be fully encrypted and stored securely
                </Text>
              </VStack>
            )}
          </VStack>

          {/* Security Notice */}
          <Box p={6} bg="blue.900" rounded="lg" maxW="800px" textAlign="center">
            <Text fontSize="lg" fontWeight="bold" mb={2}>
              🛡️ Your Security is Our Priority
            </Text>
            <Text color="gray.300">
              All wallet generation happens locally on your device. Your private keys never leave your computer.
              This demonstration shows the interface - the real application includes full wallet functionality.
            </Text>
          </Box>
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default App;