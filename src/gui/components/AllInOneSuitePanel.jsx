import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  Input,
  Select,
  Switch,
  Progress,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
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
  useColorModeValue,
  Divider,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  Textarea
} from '@chakra-ui/react';
import {
  FaPlay,
  FaStop,
  FaPause,
  FaRocket,
  FaChartLine,
  FaTrendingUp,
  FaComments,
  FaShield,
  FaCog,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaEye
} from 'react-icons/fa';

const { ipcRenderer } = window.require('electron');

const AllInOneSuitePanel = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentToken, setCurrentToken] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('pump.fun');
  const [activeBots, setActiveBots] = useState(new Set());
  const [suiteStats, setSuiteStats] = useState({});
  const [botStats, setBotStats] = useState({});
  const [operationHistory, setOperationHistory] = useState([]);
  const [healthStatus, setHealthStatus] = useState({});
  const [config, setConfig] = useState({});
  const [logs, setLogs] = useState([]);

  const { isOpen: isConfigOpen, onOpen: onConfigOpen, onClose: onConfigClose } = useDisclosure();
  const { isOpen: isStatsOpen, onOpen: onStatsOpen, onClose: onStatsClose } = useDisclosure();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        await ipcRenderer.invoke('get-suite-status');
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize component:', error);
      }
    };

    initializeComponent();

    // Set up IPC listeners
    const handleSuiteUpdate = (event, data) => {
      setSuiteStats(data.suite || {});
      setBotStats(data.bots || {});
      setActiveBots(new Set(data.suite?.activeBots || []));
      setIsRunning(data.suite?.activeBots?.length > 0);
    };

    const handleHealthUpdate = (event, data) => {
      setHealthStatus(data);
    };

    const handleOperationHistory = (event, data) => {
      setOperationHistory(data);
    };

    const handleLogs = (event, data) => {
      setLogs(prev => [...prev.slice(-99), data]); // Keep last 100 logs
    };

    ipcRenderer.on('suite-stats-update', handleSuiteUpdate);
    ipcRenderer.on('suite-health-update', handleHealthUpdate);
    ipcRenderer.on('suite-operation-history', handleOperationHistory);
    ipcRenderer.on('suite-logs', handleLogs);

    return () => {
      ipcRenderer.removeAllListeners('suite-stats-update');
      ipcRenderer.removeAllListeners('suite-health-update');
      ipcRenderer.removeAllListeners('suite-operation-history');
      ipcRenderer.removeAllListeners('suite-logs');
    };
  }, []);

  // Initialize suite
  const handleInitialize = async () => {
    try {
      const result = await ipcRenderer.invoke('initialize-suite');
      if (result.success) {
        setIsInitialized(true);
        addLog('✅ All-in-One Suite initialized successfully', 'success');
      }
    } catch (error) {
      addLog(`❌ Failed to initialize suite: ${error.message}`, 'error');
    }
  };

  // Start full suite
  const handleStartSuite = async () => {
    if (!currentToken.trim()) {
      addLog('❌ Please enter a token address', 'error');
      return;
    }

    try {
      const result = await ipcRenderer.invoke('start-full-suite', {
        tokenAddress: currentToken.trim(),
        platform: selectedPlatform
      });

      if (result.success) {
        setIsRunning(true);
        addLog(`🚀 Suite started for ${currentToken} on ${selectedPlatform}`, 'success');
      }
    } catch (error) {
      addLog(`❌ Failed to start suite: ${error.message}`, 'error');
    }
  };

  // Stop full suite
  const handleStopSuite = async () => {
    try {
      const result = await ipcRenderer.invoke('stop-full-suite');
      if (result.success) {
        setIsRunning(false);
        setActiveBots(new Set());
        addLog('🛑 Suite stopped successfully', 'info');
      }
    } catch (error) {
      addLog(`❌ Failed to stop suite: ${error.message}`, 'error');
    }
  };

  // Start/stop individual bot
  const handleBotToggle = async (botName, enable) => {
    try {
      if (enable) {
        await ipcRenderer.invoke('start-bot', { botName, tokenAddress: currentToken, platform: selectedPlatform });
        addLog(`✅ ${botName} started`, 'success');
      } else {
        await ipcRenderer.invoke('stop-bot', { botName });
        addLog(`🛑 ${botName} stopped`, 'info');
      }
    } catch (error) {
      addLog(`❌ Failed to toggle ${botName}: ${error.message}`, 'error');
    }
  };

  // Emergency stop
  const handleEmergencyStop = async () => {
    try {
      await ipcRenderer.invoke('emergency-stop-suite');
      setIsRunning(false);
      setActiveBots(new Set());
      addLog('🚨 EMERGENCY STOP executed', 'error');
    } catch (error) {
      addLog(`❌ Emergency stop failed: ${error.message}`, 'error');
    }
  };

  // Update configuration
  const handleConfigUpdate = async (newConfig) => {
    try {
      await ipcRenderer.invoke('update-suite-config', newConfig);
      setConfig(newConfig);
      addLog('🔧 Configuration updated', 'success');
      onConfigClose();
    } catch (error) {
      addLog(`❌ Failed to update config: ${error.message}`, 'error');
    }
  };

  // Add log entry
  const addLog = (message, type = 'info') => {
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [...prev.slice(-99), logEntry]);
  };

  // Get bot status color
  const getBotStatusColor = (botName) => {
    if (activeBots.has(botName)) return 'green';
    return 'gray';
  };

  // Get bot icon
  const getBotIcon = (botName) => {
    switch (botName) {
      case 'volumeBot': return FaChartLine;
      case 'bumpBot': return FaTrendingUp;
      case 'commentBot': return FaComments;
      case 'launchProtector': return FaShield;
      default: return FaRocket;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <Box p={6} maxW="full" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Card bg={bg} borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Heading size="lg" color="purple.400">
                  🚀 All-in-One Suite
                </Heading>
                <Text color="gray.500">
                  Complete token promotion toolkit for Pump.fun & Pump.swap
                </Text>
              </VStack>
              <HStack spacing={2}>
                <Badge colorScheme={isRunning ? 'green' : 'gray'}>
                  {isRunning ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
                <Badge colorScheme="blue">
                  {activeBots.size} Bots Running
                </Badge>
              </HStack>
            </HStack>
          </CardHeader>
        </Card>

        {/* Quick Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Stat bg={bg} p={4} rounded="lg" borderColor={borderColor} borderWidth={1}>
            <StatLabel>Operations</StatLabel>
            <StatNumber>{suiteStats.totalOperations || 0}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {suiteStats.operationsPerHour || 0}/hour
            </StatHelpText>
          </Stat>
          <Stat bg={bg} p={4} rounded="lg" borderColor={borderColor} borderWidth={1}>
            <StatLabel>Total Cost</StatLabel>
            <StatNumber>{(suiteStats.totalCost || 0).toFixed(4)} SOL</StatNumber>
            <StatHelpText>
              {formatCurrency((suiteStats.costPerHour || 0) * 100)}/hour
            </StatHelpText>
          </Stat>
          <Stat bg={bg} p={4} rounded="lg" borderColor={borderColor} borderWidth={1}>
            <StatLabel>Success Rate</StatLabel>
            <StatNumber>{suiteStats.successRate || '0%'}</StatNumber>
            <StatHelpText>
              {suiteStats.successfulOperations || 0} successful
            </StatHelpText>
          </Stat>
          <Stat bg={bg} p={4} rounded="lg" borderColor={borderColor} borderWidth={1}>
            <StatLabel>Uptime</StatLabel>
            <StatNumber>
              {suiteStats.runtime ? Math.floor(suiteStats.runtime / 60000) : 0}m
            </StatNumber>
            <StatHelpText>
              {activeBots.size} bots active
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Main Control Panel */}
        <Card bg={bg} borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">Control Panel</Heading>
              <HStack spacing={2}>
                <IconButton
                  icon={<FaCog />}
                  onClick={onConfigOpen}
                  aria-label="Configuration"
                  size="sm"
                />
                <IconButton
                  icon={<FaInfoCircle />}
                  onClick={onStatsOpen}
                  aria-label="Detailed Stats"
                  size="sm"
                />
                <Button
                  colorScheme="red"
                  size="sm"
                  onClick={handleEmergencyStop}
                  isDisabled={!isRunning}
                >
                  Emergency Stop
                </Button>
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {/* Token Input */}
              <HStack spacing={4}>
                <FormControl flex={2}>
                  <FormLabel>Token Address</FormLabel>
                  <Input
                    placeholder="Enter token address..."
                    value={currentToken}
                    onChange={(e) => setCurrentToken(e.target.value)}
                    isDisabled={isRunning}
                  />
                </FormControl>
                <FormControl flex={1}>
                  <FormLabel>Platform</FormLabel>
                  <Select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    isDisabled={isRunning}
                  >
                    <option value="pump.fun">Pump.fun</option>
                    <option value="pump.swap">Pump.swap</option>
                  </Select>
                </FormControl>
              </HStack>

              {/* Main Controls */}
              <HStack spacing={4} justify="center">
                {!isInitialized ? (
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={handleInitialize}
                    leftIcon={<FaRocket />}
                  >
                    Initialize Suite
                  </Button>
                ) : (
                  <>
                    {!isRunning ? (
                      <Button
                        colorScheme="green"
                        size="lg"
                        onClick={handleStartSuite}
                        leftIcon={<FaPlay />}
                        isDisabled={!currentToken.trim()}
                      >
                        Start Full Suite
                      </Button>
                    ) : (
                      <Button
                        colorScheme="red"
                        size="lg"
                        onClick={handleStopSuite}
                        leftIcon={<FaStop />}
                      >
                        Stop All Bots
                      </Button>
                    )}
                  </>
                )}
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Bot Status Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          {['volumeBot', 'bumpBot', 'commentBot', 'launchProtector'].map((botName) => {
            const IconComponent = getBotIcon(botName);
            const isActive = activeBots.has(botName);
            const stats = botStats[botName] || {};

            return (
              <Card key={botName} bg={bg} borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between" align="center">
                      <HStack>
                        <IconComponent color={isActive ? 'green' : 'gray'} />
                        <Text fontWeight="bold" fontSize="sm">
                          {botName.replace('Bot', '').toUpperCase()}
                        </Text>
                      </HStack>
                      <Badge colorScheme={getBotStatusColor(botName)} size="sm">
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </HStack>

                    {/* Bot-specific stats */}
                    {botName === 'volumeBot' && stats.totalVolume && (
                      <VStack spacing={1} align="start" fontSize="xs">
                        <Text>Volume: {stats.totalVolume.toFixed(4)} SOL</Text>
                        <Text>Trades: {stats.totalTrades}</Text>
                        <Text>Success: {stats.successRate}</Text>
                      </VStack>
                    )}

                    {botName === 'bumpBot' && stats.totalBumps && (
                      <VStack spacing={1} align="start" fontSize="xs">
                        <Text>Bumps: {stats.totalBumps}</Text>
                        <Text>Position: #{stats.currentPosition || 999}</Text>
                        <Text>Cost: {(stats.totalCost || 0).toFixed(4)} SOL</Text>
                      </VStack>
                    )}

                    {botName === 'commentBot' && stats.totalComments && (
                      <VStack spacing={1} align="start" fontSize="xs">
                        <Text>Comments: {stats.totalComments}</Text>
                        <Text>Engagement: {stats.totalEngagement || 0}</Text>
                        <Text>Success: {stats.successRate}</Text>
                      </VStack>
                    )}

                    {botName === 'launchProtector' && stats.totalProtections && (
                      <VStack spacing={1} align="start" fontSize="xs">
                        <Text>Protected: {stats.totalProtections}</Text>
                        <Text>Snipers: {stats.snipersDetected || 0}</Text>
                        <Text>Success: {stats.successRate}</Text>
                      </VStack>
                    )}

                    <Switch
                      isChecked={isActive}
                      onChange={(e) => handleBotToggle(botName, e.target.checked)}
                      isDisabled={!isInitialized || (!isRunning && !currentToken.trim())}
                      size="sm"
                    />
                  </VStack>
                </CardBody>
              </Card>
            );
          })}
        </SimpleGrid>

        {/* Tabs for detailed information */}
        <Tabs variant="enclosed" colorScheme="purple">
          <TabList>
            <Tab>Live Activity</Tab>
            <Tab>Operation History</Tab>
            <Tab>Health Monitor</Tab>
            <Tab>Console Logs</Tab>
          </TabList>

          <TabPanels>
            {/* Live Activity */}
            <TabPanel>
              <Card bg={bg} borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="sm">Real-Time Activity</Heading>
                      <Badge colorScheme="green">LIVE</Badge>
                    </HStack>
                    
                    {isRunning ? (
                      <Box>
                        <Text mb={2}>Current Token: {suiteStats.currentToken?.address}</Text>
                        <Text mb={2}>Platform: {suiteStats.currentToken?.platform}</Text>
                        <Progress
                          value={75}
                          colorScheme="green"
                          size="sm"
                          hasStripe
                          isAnimated
                        />
                        <Text fontSize="xs" mt={1}>Operations running smoothly...</Text>
                      </Box>
                    ) : (
                      <Alert status="info">
                        <AlertIcon />
                        <AlertDescription>
                          No active operations. Start the suite to see live activity.
                        </AlertDescription>
                      </Alert>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Operation History */}
            <TabPanel>
              <Card bg={bg} borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm">Operation History</Heading>
                    <TableContainer>
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>Time</Th>
                            <Th>Type</Th>
                            <Th>Bots</Th>
                            <Th>Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {operationHistory.slice(-10).map((op, index) => (
                            <Tr key={index}>
                              <Td>{new Date(op.timestamp).toLocaleTimeString()}</Td>
                              <Td>{op.type}</Td>
                              <Td>{op.bots?.join(', ') || 'N/A'}</Td>
                              <Td>
                                <Badge colorScheme={op.success ? 'green' : 'red'}>
                                  {op.success ? 'Success' : 'Failed'}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Health Monitor */}
            <TabPanel>
              <Card bg={bg} borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm">System Health</Heading>
                    {Object.entries(healthStatus.status || {}).map(([botName, status]) => (
                      <HStack key={botName} justify="space-between" p={3} bg="gray.50" rounded="md">
                        <Text fontWeight="medium">{botName}</Text>
                        <Badge colorScheme={status.running ? 'green' : 'red'}>
                          {status.running ? 'Healthy' : 'Offline'}
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Console Logs */}
            <TabPanel>
              <Card bg={bg} borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="sm">Console Logs</Heading>
                      <Button size="xs" onClick={() => setLogs([])}>
                        Clear
                      </Button>
                    </HStack>
                    <Box
                      h="300px"
                      overflowY="auto"
                      bg="black"
                      color="green.400"
                      p={3}
                      rounded="md"
                      fontFamily="mono"
                      fontSize="xs"
                    >
                      {logs.map((log, index) => (
                        <Box key={index} mb={1}>
                          <Text as="span" color="gray.400">
                            [{log.timestamp}]
                          </Text>{' '}
                          <Text
                            as="span"
                            color={
                              log.type === 'error' ? 'red.400' :
                              log.type === 'success' ? 'green.400' :
                              log.type === 'warning' ? 'yellow.400' :
                              'white'
                            }
                          >
                            {log.message}
                          </Text>
                        </Box>
                      ))}
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Configuration Modal */}
      <Modal isOpen={isConfigOpen} onClose={onConfigClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Suite Configuration</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Heading size="sm">Bot Settings</Heading>
              
              {/* Volume Bot Config */}
              <Box p={4} border="1px" borderColor="gray.200" rounded="md">
                <Text fontWeight="bold" mb={3}>Volume Bot</Text>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm">Min Trade (SOL)</FormLabel>
                    <NumberInput size="sm" min={0.001} max={1} step={0.001}>
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Max Trade (SOL)</FormLabel>
                    <NumberInput size="sm" min={0.01} max={10} step={0.01}>
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
              </Box>

              {/* Bump Bot Config */}
              <Box p={4} border="1px" borderColor="gray.200" rounded="md">
                <Text fontWeight="bold" mb={3}>Bump Bot</Text>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm">Bump Amount (SOL)</FormLabel>
                    <NumberInput size="sm" min={0.001} max={1} step={0.001}>
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Target Position</FormLabel>
                    <NumberInput size="sm" min={1} max={100} step={1}>
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Button colorScheme="blue" onClick={() => handleConfigUpdate({})}>
                Save Configuration
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Stats Modal */}
      <Modal isOpen={isStatsOpen} onClose={onStatsClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Detailed Statistics</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              {Object.entries(botStats).map(([botName, stats]) => (
                <Box key={botName} p={4} border="1px" borderColor="gray.200" rounded="md">
                  <Text fontWeight="bold" mb={3}>{botName.toUpperCase()}</Text>
                  <SimpleGrid columns={3} spacing={4}>
                    {Object.entries(stats).map(([key, value]) => (
                      <Box key={key}>
                        <Text fontSize="xs" color="gray.500">{key}</Text>
                        <Text fontSize="sm" fontWeight="medium">
                          {typeof value === 'number' ? value.toFixed(4) : value}
                        </Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AllInOneSuitePanel;