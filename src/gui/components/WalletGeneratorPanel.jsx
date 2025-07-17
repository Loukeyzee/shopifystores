import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Progress,
  useToast,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  IconButton,
  Tooltip,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import {
  FaWallet,
  FaKey,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaCopy,
  FaShield,
  FaCoins,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaRocket,
  FaFileDownload
} from 'react-icons/fa';

const { ipcRenderer } = window.require('electron');

const WalletGeneratorPanel = () => {
  const [walletCount, setWalletCount] = useState(10);
  const [userPassword, setUserPassword] = useState('');
  const [generatedWallets, setGeneratedWallets] = useState([]);
  const [masterWallet, setMasterWallet] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);
  const [tradingManager, setTradingManager] = useState(null);
  const [loadedWallets, setLoadedWallets] = useState([]);
  const [currentToken, setCurrentToken] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('pump.fun');

  const toast = useToast();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const { isOpen: isSecurityOpen, onOpen: onSecurityOpen, onClose: onSecurityClose } = useDisclosure();
  const { isOpen: isTradingOpen, onOpen: onTradingOpen, onClose: onTradingClose } = useDisclosure();

  // Generate launch wallets
  const handleGenerateWallets = async () => {
    if (walletCount < 1 || walletCount > 50) {
      toast({
        title: 'Invalid wallet count',
        description: 'Please enter between 1 and 50 wallets',
        status: 'error',
        duration: 3000
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const result = await ipcRenderer.invoke('generate-launch-wallets', {
        count: walletCount,
        password: userPassword || null
      });

      if (result.success) {
        setGeneratedWallets(result.wallets);
        
        toast({
          title: 'Wallets Generated Successfully!',
          description: `${result.totalGenerated} wallets created and saved to ${result.filename}`,
          status: 'success',
          duration: 5000
        });

        // Show security modal
        onSecurityOpen();
      }
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error.message,
        status: 'error',
        duration: 5000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate master wallet
  const handleGenerateMasterWallet = async () => {
    setIsGenerating(true);
    
    try {
      const result = await ipcRenderer.invoke('generate-master-wallet', {
        password: userPassword || null
      });

      if (result.success) {
        setMasterWallet(result.wallet);
        
        toast({
          title: 'Master Wallet Created!',
          description: `Master wallet saved to ${result.filename}`,
          status: 'success',
          duration: 5000
        });
      }
    } catch (error) {
      toast({
        title: 'Master Wallet Generation Failed',
        description: error.message,
        status: 'error',
        duration: 5000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Load wallets for trading
  const handleLoadWallets = async (filename, password) => {
    try {
      const result = await ipcRenderer.invoke('load-wallets-for-trading', {
        filename,
        password
      });

      if (result.success) {
        setLoadedWallets(result.wallets);
        setTradingManager(result.manager);
        
        toast({
          title: 'Wallets Loaded Successfully!',
          description: `${result.wallets.length} wallets loaded for trading`,
          status: 'success',
          duration: 3000
        });

        onTradingOpen();
      }
    } catch (error) {
      toast({
        title: 'Failed to Load Wallets',
        description: error.message,
        status: 'error',
        duration: 5000
      });
    }
  };

  // Coordinated buy
  const handleCoordinatedBuy = async (walletIds, amount) => {
    if (!currentToken) {
      toast({
        title: 'No Token Set',
        description: 'Please set a token address first',
        status: 'error',
        duration: 3000
      });
      return;
    }

    try {
      const result = await ipcRenderer.invoke('coordinated-buy', {
        walletIds,
        amount,
        token: currentToken,
        platform: selectedPlatform
      });

      toast({
        title: 'Coordinated Buy Complete',
        description: `${result.successful}/${walletIds.length} wallets successful`,
        status: result.successful > 0 ? 'success' : 'error',
        duration: 5000
      });
    } catch (error) {
      toast({
        title: 'Coordinated Buy Failed',
        description: error.message,
        status: 'error',
        duration: 5000
      });
    }
  };

  // Sell all tokens
  const handleSellAll = async (percentage = 100) => {
    try {
      const result = await ipcRenderer.invoke('sell-all-tokens', {
        percentage
      });

      toast({
        title: 'Mass Sell Complete',
        description: `${result.successful} wallets sold | Profit: ${result.totalProfit.toFixed(4)} SOL`,
        status: 'success',
        duration: 5000
      });
    } catch (error) {
      toast({
        title: 'Mass Sell Failed',
        description: error.message,
        status: 'error',
        duration: 5000
      });
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      status: 'info',
      duration: 2000
    });
  };

  return (
    <Box p={6} maxW="full" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Card bg={bg} borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Heading size="lg" color="blue.400">
                  🔐 Secure Wallet Generator
                </Heading>
                <Text color="gray.500">
                  Generate secure wallets for token launch trading - Nothing stored on our servers!
                </Text>
              </VStack>
              <Badge colorScheme="green" variant="solid" p={2}>
                100% SECURE
              </Badge>
            </HStack>
          </CardHeader>
        </Card>

        {/* Security Alert */}
        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>Complete Security & Privacy!</AlertTitle>
            <AlertDescription>
              All wallets are generated locally on your device. Private keys and seed phrases are never sent to our servers. 
              Files are encrypted and only you have access.
            </AlertDescription>
          </Box>
        </Alert>

        {/* Generation Controls */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Generate Wallets</Tab>
            <Tab>Launch Trading</Tab>
            <Tab>Security Guide</Tab>
          </TabList>

          <TabPanels>
            {/* Generate Wallets Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {/* Launch Wallets */}
                  <Card bg={bg} borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">🎯 Launch Trading Wallets</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <FormControl>
                          <FormLabel>Number of Wallets</FormLabel>
                          <NumberInput
                            value={walletCount}
                            onChange={(value) => setWalletCount(parseInt(value))}
                            min={1}
                            max={50}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </FormControl>

                        <FormControl>
                          <FormLabel>Password (Optional)</FormLabel>
                          <Input
                            type="password"
                            value={userPassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                            placeholder="Leave empty for auto-generated password"
                          />
                        </FormControl>

                        <Button
                          colorScheme="blue"
                          onClick={handleGenerateWallets}
                          isLoading={isGenerating}
                          loadingText="Generating..."
                          leftIcon={<FaWallet />}
                          size="lg"
                        >
                          Generate Launch Wallets
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Master Wallet */}
                  <Card bg={bg} borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="md">👑 Master Developer Wallet</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Text fontSize="sm" color="gray.600">
                          Your main wallet for funding launch operations and receiving profits.
                        </Text>

                        <Button
                          colorScheme="purple"
                          onClick={handleGenerateMasterWallet}
                          isLoading={isGenerating}
                          loadingText="Generating..."
                          leftIcon={<FaKey />}
                          size="lg"
                        >
                          Generate Master Wallet
                        </Button>

                        {masterWallet && (
                          <Box p={4} bg="purple.50" rounded="md">
                            <Text fontWeight="bold">Master Wallet Created:</Text>
                            <Text fontSize="sm" fontFamily="mono">
                              {masterWallet.address}
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Generated Wallets Display */}
                {generatedWallets.length > 0 && (
                  <Card bg={bg} borderColor={borderColor}>
                    <CardHeader>
                      <HStack justify="space-between">
                        <Heading size="md">📋 Generated Wallets</Heading>
                        <HStack>
                          <Button
                            size="sm"
                            onClick={() => setShowPrivateKeys(!showPrivateKeys)}
                            leftIcon={showPrivateKeys ? <FaEyeSlash /> : <FaEye />}
                          >
                            {showPrivateKeys ? 'Hide' : 'Show'} Private Keys
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="green"
                            leftIcon={<FaFileDownload />}
                            onClick={() => ipcRenderer.invoke('export-wallets', 'csv')}
                          >
                            Export CSV
                          </Button>
                        </HStack>
                      </HStack>
                    </CardHeader>
                    <CardBody>
                      <TableContainer>
                        <Table size="sm">
                          <Thead>
                            <Tr>
                              <Th>Name</Th>
                              <Th>Address</Th>
                              {showPrivateKeys && <Th>Private Key</Th>}
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {generatedWallets.slice(0, 10).map((wallet, index) => (
                              <Tr key={index}>
                                <Td fontWeight="bold">LaunchWallet_{index + 1}</Td>
                                <Td fontFamily="mono" fontSize="xs">
                                  {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                                </Td>
                                {showPrivateKeys && (
                                  <Td fontFamily="mono" fontSize="xs">
                                    {wallet.privateKey.slice(0, 12)}...
                                  </Td>
                                )}
                                <Td>
                                  <IconButton
                                    size="xs"
                                    icon={<FaCopy />}
                                    onClick={() => copyToClipboard(wallet.address)}
                                    aria-label="Copy address"
                                  />
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                      
                      {generatedWallets.length > 10 && (
                        <Text mt={2} fontSize="sm" color="gray.500">
                          Showing first 10 wallets. All {generatedWallets.length} wallets saved to encrypted file.
                        </Text>
                      )}
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>

            {/* Launch Trading Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {/* Trading Controls */}
                <Card bg={bg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="md">🚀 Launch Trading Manager</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack spacing={4}>
                        <FormControl flex={2}>
                          <FormLabel>Token Address</FormLabel>
                          <Input
                            value={currentToken}
                            onChange={(e) => setCurrentToken(e.target.value)}
                            placeholder="Enter token address for trading"
                          />
                        </FormControl>
                        <FormControl flex={1}>
                          <FormLabel>Platform</FormLabel>
                          <Select
                            value={selectedPlatform}
                            onChange={(e) => setSelectedPlatform(e.target.value)}
                          >
                            <option value="pump.fun">Pump.fun</option>
                            <option value="pump.swap">Pump.swap</option>
                          </Select>
                        </FormControl>
                      </HStack>

                      <HStack spacing={4}>
                        <Button
                          colorScheme="green"
                          onClick={() => handleCoordinatedBuy([1, 2, 3, 4, 5], 0.1)}
                          leftIcon={<FaCoins />}
                          isDisabled={!currentToken || loadedWallets.length === 0}
                        >
                          Coordinated Buy (5 wallets)
                        </Button>
                        <Button
                          colorScheme="orange"
                          onClick={() => handleSellAll(50)}
                          leftIcon={<FaChartLine />}
                          isDisabled={loadedWallets.length === 0}
                        >
                          Sell 50%
                        </Button>
                        <Button
                          colorScheme="red"
                          onClick={() => handleSellAll(100)}
                          leftIcon={<FaExclamationTriangle />}
                          isDisabled={loadedWallets.length === 0}
                        >
                          Sell All
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Trading Statistics */}
                {loadedWallets.length > 0 && (
                  <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                    <Stat bg={bg} p={4} rounded="lg" borderColor={borderColor} borderWidth={1}>
                      <StatLabel>Loaded Wallets</StatLabel>
                      <StatNumber>{loadedWallets.length}</StatNumber>
                      <StatHelpText>Ready for trading</StatHelpText>
                    </Stat>
                    <Stat bg={bg} p={4} rounded="lg" borderColor={borderColor} borderWidth={1}>
                      <StatLabel>Total Balance</StatLabel>
                      <StatNumber>
                        {loadedWallets.reduce((sum, w) => sum + w.balance, 0).toFixed(4)} SOL
                      </StatNumber>
                      <StatHelpText>Across all wallets</StatHelpText>
                    </Stat>
                    <Stat bg={bg} p={4} rounded="lg" borderColor={borderColor} borderWidth={1}>
                      <StatLabel>With Tokens</StatLabel>
                      <StatNumber>
                        {loadedWallets.filter(w => w.tokenBalance > 0).length}
                      </StatNumber>
                      <StatHelpText>Holding positions</StatHelpText>
                    </Stat>
                    <Stat bg={bg} p={4} rounded="lg" borderColor={borderColor} borderWidth={1}>
                      <StatLabel>Total Profit</StatLabel>
                      <StatNumber color="green.400">
                        {loadedWallets.reduce((sum, w) => sum + w.profit, 0).toFixed(4)} SOL
                      </StatNumber>
                      <StatHelpText>Realized + Unrealized</StatHelpText>
                    </Stat>
                  </SimpleGrid>
                )}
              </VStack>
            </TabPanel>

            {/* Security Guide Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>CRITICAL SECURITY INFORMATION</AlertTitle>
                    <AlertDescription>
                      Please read and follow these security guidelines to protect your funds.
                    </AlertDescription>
                  </Box>
                </Alert>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Card bg={bg} borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="sm" color="red.400">❌ NEVER DO</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Text>• Never share private keys or seed phrases</Text>
                        <Text>• Never store passwords with wallet files</Text>
                        <Text>• Never use the same password for multiple files</Text>
                        <Text>• Never store large amounts in generated wallets</Text>
                        <Text>• Never trust screenshots or copies</Text>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card bg={bg} borderColor={borderColor}>
                    <CardHeader>
                      <Heading size="sm" color="green.400">✅ ALWAYS DO</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={2}>
                        <Text>• Backup wallet files in multiple locations</Text>
                        <Text>• Use strong, unique passwords</Text>
                        <Text>• Test with small amounts first</Text>
                        <Text>• Store passwords in password manager</Text>
                        <Text>• Withdraw profits regularly</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                <Card bg={bg} borderColor={borderColor}>
                  <CardHeader>
                    <Heading size="sm">🔐 How to Import Wallets</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="start" spacing={4}>
                      <Box>
                        <Text fontWeight="bold">Phantom Wallet:</Text>
                        <Text fontSize="sm">Settings → Import Account → Enter seed phrase or private key</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold">Solflare Wallet:</Text>
                        <Text fontSize="sm">Access Wallet → Import Wallet → Enter seed phrase</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold">Programming Use:</Text>
                        <Textarea
                          size="sm"
                          readOnly
                          value={`const { Keypair } = require('@solana/web3.js');
const privateKeyArray = Buffer.from(privateKey, 'base64');
const keypair = Keypair.fromSecretKey(privateKeyArray);`}
                        />
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Security Modal */}
      <Modal isOpen={isSecurityOpen} onClose={onSecurityClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>🔐 Wallets Generated Successfully!</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="success">
                <AlertIcon />
                <Box>
                  <AlertTitle>Wallets Created Securely!</AlertTitle>
                  <AlertDescription>
                    Your wallets have been generated and encrypted locally. The file is saved in your generated-wallets folder.
                  </AlertDescription>
                </Box>
              </Alert>

              <Box p={4} bg="yellow.50" rounded="md" border="1px" borderColor="yellow.200">
                <Text fontWeight="bold" color="yellow.800">⚠️ IMPORTANT:</Text>
                <VStack align="start" spacing={1} mt={2}>
                  <Text fontSize="sm" color="yellow.700">• Save the password in a secure location</Text>
                  <Text fontSize="sm" color="yellow.700">• Backup the wallet file to multiple locations</Text>
                  <Text fontSize="sm" color="yellow.700">• Never share private keys with anyone</Text>
                  <Text fontSize="sm" color="yellow.700">• Test with small amounts first</Text>
                </VStack>
              </Box>

              <Box p={4} bg="blue.50" rounded="md">
                <Text fontWeight="bold" color="blue.800">📋 Next Steps:</Text>
                <VStack align="start" spacing={1} mt={2}>
                  <Text fontSize="sm" color="blue.700">1. Fund your master wallet with SOL</Text>
                  <Text fontSize="sm" color="blue.700">2. Fund launch wallets from master wallet</Text>
                  <Text fontSize="sm" color="blue.700">3. Load wallets in trading manager</Text>
                  <Text fontSize="sm" color="blue.700">4. Execute coordinated token purchases</Text>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onSecurityClose}>
              I Understand
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Trading Modal */}
      <Modal isOpen={isTradingOpen} onClose={onTradingClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>🚀 Launch Trading Active</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                {loadedWallets.length} wallets loaded and ready for trading. 
                Set a token address and start coordinated buying!
              </Text>
              
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Wallet</Th>
                      <Th>Balance</Th>
                      <Th>Tokens</Th>
                      <Th>Profit</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {loadedWallets.slice(0, 5).map((wallet, index) => (
                      <Tr key={index}>
                        <Td>{wallet.name}</Td>
                        <Td>{wallet.balance.toFixed(4)} SOL</Td>
                        <Td>{wallet.tokenBalance}</Td>
                        <Td color={wallet.profit >= 0 ? 'green.400' : 'red.400'}>
                          {wallet.profit.toFixed(4)} SOL
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onTradingClose}>
              Start Trading
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WalletGeneratorPanel;