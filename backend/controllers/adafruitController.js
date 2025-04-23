const adafruitService = require('../services/adafruitService');

// @desc    Send command to device via Adafruit
// @route   POST /api/adafruit/command
// @access  Private
exports.sendCommand = async (req, res, next) => {
  try {
    const { feed, value } = req.body;
    
    // Validate input
    if (!feed || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide feed and value'
      });
    }
    
    // Send command
    const result = await adafruitService.sendCommand(feed, value);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually fetch latest data from Adafruit
// @route   GET /api/adafruit/fetch
// @access  Private
exports.fetchData = async (req, res, next) => {
  try {
    const data = await adafruitService.fetchSensorData();
    
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};