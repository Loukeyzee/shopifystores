import React, { useState, useEffect, useCallback } from 'react';
import {
  ChakraProvider,
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  Switch,
  Select,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Badge,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Icon,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { 
  FaShield, 
  FaRocket, 
  FaChartLine, 
  FaCog, 
  FaKey, 
  FaPlay, 
  FaStop, 
  FaDownload,
  FaUpload,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaBolt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from './theme';
import LaunchMonitorPanel from './components/LaunchMonitorPanel';
import WalletGeneratorPanel from './components/WalletGeneratorPanel';

const { ipcRenderer } = window.require('electron');

const MotionBox = motion(Box);
const MotionCard = motion(Card);

function App() {
  const [licenseInfo, setLicenseInfo] = useState(null);
  const [protectionStatus, setProtectionStatus] = useState('stopped');
  const [protectionStats, setProtectionStats] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  
  // Form states
  const [tokenAddress, setTokenAddress] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [buyAmount, setBuyAmount] = useState('1.0');
  const [platform, setPlatform] = useState('pump.fun');
  const [protectionLevel, setProtectionLevel] = useState('medium');
  const [customWhitelist, setCustomWhitelist] = useState('');
  
  // Modal states
  const { isOpen: isLicenseOpen, onOpen: onLicenseOpen, onClose: onLicenseClose } = useDisclosure();
  const { isOpen: isStatsOpen, onOpen: onStatsOpen, onClose: onStatsClose } = useDisclosure();
  const [licenseKey, setLicenseKey] = useState('');
  
  const toast = useToast();

  // Initialize app and check license
  useEffect(() => {
    checkLicense();
    loadInitialData();
    
    // Set up IPC listeners
    ipcRenderer.on('show-license-activation', () => {
      onLicenseOpen();
    });

    ipcRenderer.on('menu-new-protection', () => {
      resetForm();
    });

    ipcRenderer.on('menu-start-protection', () => {
      handleStartProtection();
    });

    ipcRenderer.on('menu-stop-protection', () => {
      handleStopProtection();
    });

    ipcRenderer.on('menu-view-stats', () => {
      onStatsOpen();
    });

    ipcRenderer.on('menu-enter-license', () => {
      onLicenseOpen();
    });

    return () => {
      ipcRenderer.removeAllListeners('show-license-activation');
      ipcRenderer.removeAllListeners('menu-new-protection');
      ipcRenderer.removeAllListeners('menu-start-protection');
      ipcRenderer.removeAllListeners('menu-stop-protection');
      ipcRenderer.removeAllListeners('menu-view-stats');
      ipcRenderer.removeAllListeners('menu-enter-license');
    };
  }, []);

  // Auto-refresh status
  useEffect(() => {
    const interval = setInterval(() => {
      updateProtectionStatus();
      updateStats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkLicense = async () => {
    try {
      const result = await ipcRenderer.invoke('check-license');
      setLicenseInfo(result);
      
      if (!result.valid) {
        toast({
          title: 'License Required',
          description: 'Please enter a valid license key to use protection features.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('License check failed:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      await updateProtectionStatus();
      await updateStats();
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const updateProtectionStatus = async () => {
    try {
      const status = await ipcRenderer.invoke('get-protection-status');
      setProtectionStatus(status.status || 'stopped');
    } catch (error) {
      console.error('Failed to get protection status:', error);
    }
  };

  const updateStats = async () => {
    try {
      const stats = await ipcRenderer.invoke('get-protection-stats');
      setProtectionStats(stats || {});
    } catch (error) {
      console.error('Failed to get protection stats:', error);
    }
  };

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a license key.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await ipcRenderer.invoke('activate-license', licenseKey);
      
      if (result.valid) {
        setLicenseInfo(result);
        onLicenseClose();
        setLicenseKey('');
        
        toast({
          title: 'License Activated',
          description: 'Your license has been successfully activated!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'License Activation Failed',
          description: result.error || 'Invalid license key.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to activate license: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartProtection = async () => {
    if (!licenseInfo?.valid) {
      onLicenseOpen();
      return;
    }

    if (!tokenAddress || !privateKey) {
      toast({
        title: 'Missing Information',
        description: 'Please enter token address and private key.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const config = {
        tokenAddress,
        privateKey,
        buyAmount: parseFloat(buyAmount),
        platform,
        protectionLevel,
        customWhitelist: customWhitelist.split('\n').filter(addr => addr.trim())
      };

      let result;
      if (platform === 'pump.fun') {
        result = await ipcRenderer.invoke('protect-pumpfun-launch', config);
      } else if (platform === 'pump.swap') {
        result = await ipcRenderer.invoke('protect-pumpswap-launch', config);
      } else {
        result = await ipcRenderer.invoke('start-protection', config);
      }

      if (result.success) {
        setProtectionStatus('running');
        toast({
          title: 'Protection Started',
          description: 'Launch protection is now active!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(result.error || 'Failed to start protection');
      }
    } catch (error) {
      toast({
        title: 'Protection Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopProtection = async () => {
    setIsLoading(true);
    
    try {
      const result = await ipcRenderer.invoke('stop-protection');
      
      if (result.success) {
        setProtectionStatus('stopped');
        toast({
          title: 'Protection Stopped',
          description: 'Launch protection has been stopped.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to stop protection: ' + error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTokenAddress('');
    setPrivateKey('');
    setBuyAmount('1.0');
    setPlatform('pump.fun');
    setProtectionLevel('medium');
    setCustomWhitelist('');
  };

  const saveConfiguration = async () => {
    const config = {
      tokenAddress,
      buyAmount,
      platform,
      protectionLevel,
      customWhitelist
    };

    try {
      const result = await ipcRenderer.invoke('save-configuration', config);
      if (result.success) {
        toast({
          title: 'Configuration Saved',
          description: `Saved to ${result.path}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const loadConfiguration = async () => {
    try {
      // This would trigger a file dialog
      const result = await ipcRenderer.invoke('load-configuration');
      if (result.success) {
        const config = result.config;
        setTokenAddress(config.tokenAddress || '');
        setBuyAmount(config.buyAmount || '1.0');
        setPlatform(config.platform || 'pump.fun');
        setProtectionLevel(config.protectionLevel || 'medium');
        setCustomWhitelist(config.customWhitelist || '');
        
        toast({
          title: 'Configuration Loaded',
          description: 'Configuration has been loaded successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Load Failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'green';
      case 'paused': return 'yellow';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const getProtectionLevelColor = (level) => {
    switch (level) {
      case 'low': return 'yellow';
      case 'medium': return 'orange';
      case 'high': return 'red';
      case 'maximum': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg="gray.900" color="white">
        <Container maxW="container.xl" py={6}>
          {/* Header */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <HStack justify="space-between" mb={8}>
              <HStack spacing={4}>
                <Icon as={FaShield} boxSize={8} color="blue.400" />
                <VStack align="start" spacing={0}>
                  <Heading size="lg" color="blue.400">
                    Solana Launch Protector
                  </Heading>
                  <Text fontSize="sm" color="gray.400">
                    Advanced Anti-Sniper Protection
                  </Text>
                </VStack>
              </HStack>
              
              <HStack spacing={4}>
                <Badge 
                  colorScheme={getStatusColor(protectionStatus)} 
                  px={3} 
                  py={1} 
                  borderRadius="full"
                  textTransform="uppercase"
                  fontWeight="bold"
                >
                  {protectionStatus}
                </Badge>
                
                {licenseInfo?.valid ? (
                  <Badge colorScheme="green" px={3} py={1} borderRadius="full">
                    Licensed ({licenseInfo.plan})
                  </Badge>
                ) : (
                  <Badge colorScheme="red" px={3} py={1} borderRadius="full">
                    Unlicensed
                  </Badge>
                )}
              </HStack>
            </HStack>
          </MotionBox>

          {/* License Warning */}
          <AnimatePresence>
            {!licenseInfo?.valid && (
              <MotionBox
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                mb={6}
              >
                <Alert status="warning" borderRadius="lg">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>License Required!</AlertTitle>
                    <AlertDescription>
                      You need a valid license to use protection features.{' '}
                      <Button 
                        size="sm" 
                        variant="link" 
                        color="orange.200"
                        onClick={onLicenseOpen}
                      >
                        Enter License Key
                      </Button>
                    </AlertDescription>
                  </Box>
                </Alert>
              </MotionBox>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab><Icon as={FaBolt} mr={2} />Instant Monitor</Tab>
              <Tab><Icon as={FaRocket} mr={2} />Manual Protection</Tab>
              <Tab><Icon as={FaKey} mr={2} />Wallet Generator</Tab>
              <Tab><Icon as={FaChartLine} mr={2} />Statistics</Tab>
              <Tab><Icon as={FaCog} mr={2} />Settings</Tab>
            </TabList>

            <TabPanels>
              {/* Instant Monitor Tab */}
              <TabPanel>
                <LaunchMonitorPanel />
              </TabPanel>

              {/* Manual Protection Tab */}
              <TabPanel>
                <Grid templateColumns="repeat(12, 1fr)" gap={6}>
                  {/* Configuration Panel */}
                  <GridItem colSpan={8}>
                    <MotionCard
                      bg="gray.800"
                      borderRadius="xl"
                      border="1px"
                      borderColor="gray.700"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <CardHeader>
                        <Heading size="md">Protection Configuration</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={6} align="stretch">
                          {/* Platform Selection */}
                          <FormControl>
                            <FormLabel>Platform</FormLabel>
                            <Select 
                              value={platform} 
                              onChange={(e) => setPlatform(e.target.value)}
                              bg="gray.700"
                              border="none"
                            >
                              <option value="pump.fun">Pump.fun</option>
                              <option value="pump.swap">Pump.swap</option>
                              <option value="raydium">Raydium</option>
                              <option value="custom">Custom</option>
                            </Select>
                          </FormControl>

                          {/* Token Address */}
                          <FormControl isRequired>
                            <FormLabel>Token Address</FormLabel>
                            <Input
                              value={tokenAddress}
                              onChange={(e) => setTokenAddress(e.target.value)}
                              placeholder="Enter token contract address..."
                              bg="gray.700"
                              border="none"
                              _focus={{ ring: 2, ringColor: 'blue.500' }}
                            />
                          </FormControl>

                          {/* Private Key */}
                          <FormControl isRequired>
                            <FormLabel>Private Key</FormLabel>
                            <HStack>
                              <Input
                                type={showPrivateKey ? "text" : "password"}
                                value={privateKey}
                                onChange={(e) => setPrivateKey(e.target.value)}
                                placeholder="Enter your private key..."
                                bg="gray.700"
                                border="none"
                                _focus={{ ring: 2, ringColor: 'blue.500' }}
                              />
                              <IconButton
                                icon={showPrivateKey ? <FaEyeSlash /> : <FaEye />}
                                onClick={() => setShowPrivateKey(!showPrivateKey)}
                                variant="ghost"
                                size="sm"
                              />
                            </HStack>
                          </FormControl>

                          {/* Buy Amount */}
                          <FormControl>
                            <FormLabel>Buy Amount (SOL)</FormLabel>
                            <Input
                              type="number"
                              value={buyAmount}
                              onChange={(e) => setBuyAmount(e.target.value)}
                              min="0.1"
                              max="100"
                              step="0.1"
                              bg="gray.700"
                              border="none"
                              _focus={{ ring: 2, ringColor: 'blue.500' }}
                            />
                          </FormControl>

                          {/* Protection Level */}
                          <FormControl>
                            <FormLabel>Protection Level</FormLabel>
                            <Select 
                              value={protectionLevel} 
                              onChange={(e) => setProtectionLevel(e.target.value)}
                              bg="gray.700"
                              border="none"
                            >
                              <option value="low">Low - Basic protection</option>
                              <option value="medium">Medium - Standard protection</option>
                              <option value="high">High - Advanced protection</option>
                              <option value="maximum">Maximum - Military-grade</option>
                            </Select>
                          </FormControl>

                          {/* Custom Whitelist */}
                          {licenseInfo?.features?.customWhitelists && (
                            <FormControl>
                              <FormLabel>Custom Whitelist (one address per line)</FormLabel>
                              <Input
                                as="textarea"
                                value={customWhitelist}
                                onChange={(e) => setCustomWhitelist(e.target.value)}
                                placeholder="Enter wallet addresses to whitelist..."
                                bg="gray.700"
                                border="none"
                                _focus={{ ring: 2, ringColor: 'blue.500' }}
                                rows={4}
                              />
                            </FormControl>
                          )}

                          {/* Action Buttons */}
                          <HStack spacing={4} pt={4}>
                            <Button
                              leftIcon={<FaPlay />}
                              colorScheme="green"
                              size="lg"
                              isLoading={isLoading}
                              loadingText="Starting..."
                              onClick={handleStartProtection}
                              isDisabled={protectionStatus === 'running' || !licenseInfo?.valid}
                            >
                              Start Protection
                            </Button>
                            
                            <Button
                              leftIcon={<FaStop />}
                              colorScheme="red"
                              variant="outline"
                              size="lg"
                              onClick={handleStopProtection}
                              isDisabled={protectionStatus !== 'running'}
                            >
                              Stop Protection
                            </Button>

                            <Divider orientation="vertical" />

                            <Button
                              leftIcon={<FaDownload />}
                              variant="ghost"
                              onClick={saveConfiguration}
                            >
                              Save Config
                            </Button>

                            <Button
                              leftIcon={<FaUpload />}
                              variant="ghost"
                              onClick={loadConfiguration}
                            >
                              Load Config
                            </Button>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </MotionCard>
                  </GridItem>

                  {/* Status Panel */}
                  <GridItem colSpan={4}>
                    <VStack spacing={6}>
                      {/* Current Status */}
                      <MotionCard
                        w="full"
                        bg="gray.800"
                        borderRadius="xl"
                        border="1px"
                        borderColor="gray.700"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <CardHeader>
                          <Heading size="sm">Current Status</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={4}>
                            <Icon 
                              as={FaShield} 
                              boxSize={12} 
                              color={getStatusColor(protectionStatus) + '.400'} 
                            />
                            <Text 
                              fontSize="xl" 
                              fontWeight="bold"
                              color={getStatusColor(protectionStatus) + '.400'}
                              textTransform="uppercase"
                            >
                              {protectionStatus}
                            </Text>
                            {protectionStatus === 'running' && (
                              <Progress 
                                w="full" 
                                colorScheme="green" 
                                size="sm" 
                                isIndeterminate 
                              />
                            )}
                          </VStack>
                        </CardBody>
                      </MotionCard>

                      {/* License Info */}
                      <MotionCard
                        w="full"
                        bg="gray.800"
                        borderRadius="xl"
                        border="1px"
                        borderColor="gray.700"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <CardHeader>
                          <Heading size="sm">License Status</Heading>
                        </CardHeader>
                        <CardBody>
                          {licenseInfo?.valid ? (
                            <VStack spacing={3} align="stretch">
                              <HStack justify="space-between">
                                <Text fontSize="sm" color="gray.400">Plan:</Text>
                                <Badge colorScheme="blue">{licenseInfo.plan}</Badge>
                              </HStack>
                              <HStack justify="space-between">
                                <Text fontSize="sm" color="gray.400">Launches Left:</Text>
                                <Text fontWeight="bold">
                                  {licenseInfo.usage?.remainingLaunches === -1 
                                    ? '∞' 
                                    : licenseInfo.usage?.remainingLaunches || 0}
                                </Text>
                              </HStack>
                              <HStack justify="space-between">
                                <Text fontSize="sm" color="gray.400">Expires:</Text>
                                <Text fontSize="sm">
                                  {new Date(licenseInfo.expires).toLocaleDateString()}
                                </Text>
                              </HStack>
                            </VStack>
                          ) : (
                            <VStack spacing={3}>
                              <Icon as={FaExclamationTriangle} color="orange.400" boxSize={8} />
                              <Text color="orange.400" textAlign="center">
                                No valid license
                              </Text>
                              <Button 
                                size="sm" 
                                colorScheme="orange" 
                                onClick={onLicenseOpen}
                              >
                                Activate License
                              </Button>
                            </VStack>
                          )}
                        </CardBody>
                      </MotionCard>

                      {/* Quick Stats */}
                      <MotionCard
                        w="full"
                        bg="gray.800"
                        borderRadius="xl"
                        border="1px"
                        borderColor="gray.700"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        <CardHeader>
                          <Heading size="sm">Quick Stats</Heading>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={3}>
                            <Stat>
                              <StatLabel>Snipers Blocked</StatLabel>
                              <StatNumber color="green.400">
                                {protectionStats.snipersBlocked || 0}
                              </StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Transactions Protected</StatLabel>
                              <StatNumber color="blue.400">
                                {protectionStats.transactionsProtected || 0}
                              </StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Success Rate</StatLabel>
                              <StatNumber color="purple.400">
                                {protectionStats.successRate || '0%'}
                              </StatNumber>
                            </Stat>
                          </VStack>
                        </CardBody>
                      </MotionCard>
                    </VStack>
                  </GridItem>
                </Grid>
              </TabPanel>

              {/* Wallet Generator Tab */}
              <TabPanel>
                <WalletGeneratorPanel />
              </TabPanel>

              {/* Statistics Tab */}
              <TabPanel>
                <Text>Statistics content goes here...</Text>
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel>
                <Text>Settings content goes here...</Text>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Container>

        {/* License Activation Modal */}
        <Modal isOpen={isLicenseOpen} onClose={onLicenseClose} size="md">
          <ModalOverlay bg="blackAlpha.800" />
          <ModalContent bg="gray.800" border="1px" borderColor="gray.700">
            <ModalHeader>
              <HStack>
                <Icon as={FaKey} color="blue.400" />
                <Text>Activate License</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Text color="gray.400" textAlign="center">
                  Enter your license key to unlock all protection features.
                </Text>
                <FormControl>
                  <FormLabel>License Key</FormLabel>
                  <Input
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="Enter your license key..."
                    bg="gray.700"
                    border="none"
                    _focus={{ ring: 2, ringColor: 'blue.500' }}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onLicenseClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleActivateLicense}
                isLoading={isLoading}
                loadingText="Activating..."
              >
                Activate
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </ChakraProvider>
  );
}

export default App;