import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Switch,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Alert,
  AlertIcon,
  List,
  ListItem,
  Icon,
  Tooltip,
  Divider,
  Grid,
  GridItem,
  useToast
} from '@chakra-ui/react';
import {
  FaRocket,
  FaBolt,
  FaEye,
  FaFilter,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaChartLine,
  FaPlay,
  FaStop
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const { ipcRenderer } = window.require('electron');

const MotionBox = motion(Box);
const MotionCard = motion(Card);

function LaunchMonitorPanel() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [autoProtect, setAutoProtect] = useState(true);
  const [platforms, setPlatforms] = useState(['pump.fun', 'pump.swap']);
  const [detectedTokens, setDetectedTokens] = useState([]);
  const [monitorStats, setMonitorStats] = useState({});
  const [filters, setFilters] = useState({
    minLiquidity: 0.1,
    maxMarketCap: 1000000,
    requireMetadata: true
  });
  const [instantStats, setInstantStats] = useState({});
  
  const toast = useToast();

  useEffect(() => {
    // Set up IPC listeners for launch monitoring
    ipcRenderer.on('token-detected', handleTokenDetected);
    ipcRenderer.on('protection-triggered', handleProtectionTriggered);
    ipcRenderer.on('protection-success', handleProtectionSuccess);
    ipcRenderer.on('protection-error', handleProtectionError);
    ipcRenderer.on('monitor-stats-updated', handleStatsUpdate);

    // Load initial state
    loadMonitorStatus();

    return () => {
      ipcRenderer.removeAllListeners('token-detected');
      ipcRenderer.removeAllListeners('protection-triggered');
      ipcRenderer.removeAllListeners('protection-success');
      ipcRenderer.removeAllListeners('protection-error');
      ipcRenderer.removeAllListeners('monitor-stats-updated');
    };
  }, []);

  const loadMonitorStatus = async () => {
    try {
      const status = await ipcRenderer.invoke('get-launch-monitor-status');
      setIsMonitoring(status.isMonitoring);
      setMonitorStats(status.stats || {});
      setInstantStats(status.instantStats || {});
    } catch (error) {
      console.error('Failed to load monitor status:', error);
    }
  };

  const handleTokenDetected = (event, tokenData) => {
    console.log('🎯 Token detected:', tokenData);
    
    setDetectedTokens(prev => [{
      ...tokenData,
      id: Date.now(),
      status: 'detected'
    }, ...prev.slice(0, 19)]); // Keep last 20 tokens

    toast({
      title: 'New Token Detected!',
      description: `${tokenData.symbol} on ${tokenData.platform}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleProtectionTriggered = (event, data) => {
    console.log('🛡️ Protection triggered:', data);
    
    setDetectedTokens(prev => prev.map(token => 
      token.address === data.token.address 
        ? { ...token, status: 'protecting', protectionStarted: Date.now() }
        : token
    ));
  };

  const handleProtectionSuccess = (event, data) => {
    console.log('✅ Protection success:', data);
    
    setDetectedTokens(prev => prev.map(token => 
      token.address === data.token.address 
        ? { 
            ...token, 
            status: 'protected', 
            executionTime: data.executionTime,
            result: data.result
          }
        : token
    ));

    toast({
      title: 'Protection Success!',
      description: `${data.token.symbol} protected in ${data.executionTime}ms`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  const handleProtectionError = (event, data) => {
    console.log('❌ Protection error:', data);
    
    setDetectedTokens(prev => prev.map(token => 
      token.address === data.token.address 
        ? { 
            ...token, 
            status: 'failed', 
            error: data.error,
            executionTime: data.executionTime
          }
        : token
    ));

    toast({
      title: 'Protection Failed',
      description: `${data.token.symbol}: ${data.error}`,
      status: 'error',
      duration: 8000,
      isClosable: true,
    });
  };

  const handleStatsUpdate = (event, stats) => {
    setMonitorStats(stats.monitor || {});
    setInstantStats(stats.instant || {});
  };

  const startMonitoring = async () => {
    try {
      const config = {
        autoProtect,
        platforms,
        filters
      };

      await ipcRenderer.invoke('start-launch-monitoring', config);
      setIsMonitoring(true);
      
      toast({
        title: 'Launch Monitoring Started',
        description: `Monitoring ${platforms.join(', ')} for new launches`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to Start Monitoring',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const stopMonitoring = async () => {
    try {
      await ipcRenderer.invoke('stop-launch-monitoring');
      setIsMonitoring(false);
      
      toast({
        title: 'Launch Monitoring Stopped',
        description: 'No longer monitoring for new launches',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to Stop Monitoring',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'detected': return 'blue';
      case 'protecting': return 'yellow';
      case 'protected': return 'green';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'detected': return FaEye;
      case 'protecting': return FaBolt;
      case 'protected': return FaCheckCircle;
      case 'failed': return FaExclamationCircle;
      default: return FaClock;
    }
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Monitor Controls */}
        <MotionCard
          bg="gray.800"
          borderRadius="xl"
          border="1px"
          borderColor="gray.700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardHeader>
            <HStack justify="space-between">
              <HStack>
                <Icon as={FaRocket} color="blue.400" />
                <Text fontSize="lg" fontWeight="bold">Launch Monitor</Text>
              </HStack>
              <Badge
                colorScheme={isMonitoring ? 'green' : 'gray'}
                px={3}
                py={1}
                borderRadius="full"
                textTransform="uppercase"
              >
                {isMonitoring ? 'ACTIVE' : 'STOPPED'}
              </Badge>
            </HStack>
          </CardHeader>
          <CardBody>
            <Grid templateColumns="repeat(12, 1fr)" gap={6}>
              {/* Configuration */}
              <GridItem colSpan={8}>
                <VStack spacing={4} align="stretch">
                  {/* Auto Protection Toggle */}
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">
                      Auto-Protect New Launches
                    </FormLabel>
                    <Switch
                      isChecked={autoProtect}
                      onChange={(e) => setAutoProtect(e.target.checked)}
                      colorScheme="green"
                      size="lg"
                    />
                  </FormControl>

                  {/* Platform Selection */}
                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={2}>Platforms to Monitor</Text>
                    <HStack spacing={4}>
                      {['pump.fun', 'pump.swap', 'raydium'].map(platform => (
                        <Box key={platform}>
                          <Switch
                            isChecked={platforms.includes(platform)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPlatforms(prev => [...prev, platform]);
                              } else {
                                setPlatforms(prev => prev.filter(p => p !== platform));
                              }
                            }}
                            colorScheme="blue"
                          />
                          <Text fontSize="sm" mt={1}>{platform}</Text>
                        </Box>
                      ))}
                    </HStack>
                  </Box>

                  {/* Filters */}
                  <Box>
                    <Text fontSize="sm" color="gray.400" mb={2}>Filters</Text>
                    <HStack spacing={4}>
                      <FormControl>
                        <FormLabel fontSize="xs">Min Liquidity (SOL)</FormLabel>
                        <NumberInput
                          value={filters.minLiquidity}
                          onChange={(value) => setFilters(prev => ({ ...prev, minLiquidity: parseFloat(value) }))}
                          min={0}
                          max={100}
                          step={0.1}
                          size="sm"
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="xs">Max Market Cap (USD)</FormLabel>
                        <NumberInput
                          value={filters.maxMarketCap}
                          onChange={(value) => setFilters(prev => ({ ...prev, maxMarketCap: parseInt(value) }))}
                          min={1000}
                          max={10000000}
                          step={1000}
                          size="sm"
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </HStack>
                  </Box>
                </VStack>
              </GridItem>

              {/* Controls */}
              <GridItem colSpan={4}>
                <VStack spacing={4}>
                  <Button
                    leftIcon={<Icon as={isMonitoring ? FaStop : FaPlay} />}
                    colorScheme={isMonitoring ? 'red' : 'green'}
                    size="lg"
                    width="full"
                    onClick={isMonitoring ? stopMonitoring : startMonitoring}
                  >
                    {isMonitoring ? 'Stop Monitor' : 'Start Monitor'}
                  </Button>

                  {isMonitoring && (
                    <Alert status="success" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <Text fontSize="sm" fontWeight="bold">Monitoring Active</Text>
                        <Text fontSize="xs">Watching for new launches...</Text>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              </GridItem>
            </Grid>
          </CardBody>
        </MotionCard>

        {/* Performance Stats */}
        <Grid templateColumns="repeat(4, 1fr)" gap={4}>
          <MotionCard
            bg="gray.800"
            borderRadius="lg"
            border="1px"
            borderColor="gray.700"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CardBody>
              <Stat>
                <StatLabel>Tokens Detected</StatLabel>
                <StatNumber color="blue.400">
                  {monitorStats.tokensDetected || 0}
                </StatNumber>
                <StatHelpText>Total detected</StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            bg="gray.800"
            borderRadius="lg"
            border="1px"
            borderColor="gray.700"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CardBody>
              <Stat>
                <StatLabel>Protected</StatLabel>
                <StatNumber color="green.400">
                  {instantStats.successfulProtections || 0}
                </StatNumber>
                <StatHelpText>Success rate: {instantStats.successRate || '0%'}</StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            bg="gray.800"
            borderRadius="lg"
            border="1px"
            borderColor="gray.700"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CardBody>
              <Stat>
                <StatLabel>Avg Response</StatLabel>
                <StatNumber color="purple.400">
                  {instantStats.averageResponseTime ? `${Math.round(instantStats.averageResponseTime)}ms` : '0ms'}
                </StatNumber>
                <StatHelpText>Lightning fast</StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            bg="gray.800"
            borderRadius="lg"
            border="1px"
            borderColor="gray.700"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <CardBody>
              <Stat>
                <StatLabel>Fastest</StatLabel>
                <StatNumber color="yellow.400">
                  {instantStats.fastestResponse && instantStats.fastestResponse !== Infinity 
                    ? `${Math.round(instantStats.fastestResponse)}ms` 
                    : '0ms'}
                </StatNumber>
                <StatHelpText>Personal best</StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>
        </Grid>

        {/* Recent Detections */}
        <MotionCard
          bg="gray.800"
          borderRadius="xl"
          border="1px"
          borderColor="gray.700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <CardHeader>
            <HStack>
              <Icon as={FaBolt} color="yellow.400" />
              <Text fontSize="lg" fontWeight="bold">Recent Detections</Text>
              <Badge colorScheme="blue" ml={2}>{detectedTokens.length}</Badge>
            </HStack>
          </CardHeader>
          <CardBody>
            {detectedTokens.length === 0 ? (
              <Text color="gray.500" textAlign="center" py={8}>
                No tokens detected yet. Start monitoring to see real-time launches!
              </Text>
            ) : (
              <List spacing={3} maxH="400px" overflowY="auto">
                <AnimatePresence>
                  {detectedTokens.map((token, index) => (
                    <MotionBox
                      key={token.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <ListItem
                        p={4}
                        bg="gray.700"
                        borderRadius="md"
                        border="1px"
                        borderColor="gray.600"
                      >
                        <HStack justify="space-between">
                          <HStack>
                            <Icon as={getStatusIcon(token.status)} color={`${getStatusColor(token.status)}.400`} />
                            <VStack align="start" spacing={0}>
                              <HStack>
                                <Text fontWeight="bold">{token.symbol || 'Unknown'}</Text>
                                <Badge colorScheme="blue" size="sm">{token.platform}</Badge>
                              </HStack>
                              <Text fontSize="xs" color="gray.400" fontFamily="mono">
                                {token.address?.substring(0, 8)}...{token.address?.substring(-8)}
                              </Text>
                            </VStack>
                          </HStack>

                          <VStack align="end" spacing={0}>
                            <Badge colorScheme={getStatusColor(token.status)} size="sm">
                              {token.status}
                            </Badge>
                            {token.executionTime && (
                              <Text fontSize="xs" color="gray.400">
                                {token.executionTime}ms
                              </Text>
                            )}
                            <Text fontSize="xs" color="gray.500">
                              {new Date(token.detectedAt || Date.now()).toLocaleTimeString()}
                            </Text>
                          </VStack>
                        </HStack>

                        {token.status === 'protecting' && (
                          <Box mt={2}>
                            <Progress
                              size="sm"
                              colorScheme="yellow"
                              isIndeterminate
                            />
                            <Text fontSize="xs" color="yellow.400" mt={1}>
                              Executing protection...
                            </Text>
                          </Box>
                        )}

                        {token.error && (
                          <Box mt={2}>
                            <Text fontSize="xs" color="red.400">
                              Error: {token.error}
                            </Text>
                          </Box>
                        )}
                      </ListItem>
                    </MotionBox>
                  ))}
                </AnimatePresence>
              </List>
            )}
          </CardBody>
        </MotionCard>
      </VStack>
    </Box>
  );
}

export default LaunchMonitorPanel;