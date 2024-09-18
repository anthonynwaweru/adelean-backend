'use strict';

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(express.json());

const URL = process.env.URL_API;

let authToken = '';
let tokenExpiration = 0;
// Token authentication function
const getAuthToken = async () => {
  try {
    const response = await axios.post(`${URL}/user/guest/login`, {
      username: 'candidate@adelean.com',
      password: 'candidateforadelean',
    });
    if (response.data && response.data.accessToken) {
      authToken = response.data.accessToken;
      tokenExpiration = Date.now() + 3600000;
      console.log('Token retrieved:', authToken, response.data);
    } else {
      console.error('Token not found in response:', response.data);
    }
  } catch (error) {
    console.error(
      'Error authenticating:',
      error.response ? error.response.data : error.message
    );
  }
};

// middleware to verify token
const verifyAuthToken = async (req, res, next) => {
  if (!authToken || Date.now() >= tokenExpiration) {
    try {
      await getAuthToken();
    } catch (error) {
      return res
        .status(500)
        .json({ error: 'Failed to retrieve authentication token' });
    }
  }
  req.authToken = authToken;
  next();
};

// Route to get all searchposts
app.post('/search', verifyAuthToken, async (req, res) => {
  const { text, searchEngineId, id, from = 0, size = 10 } = req.body;

  if (!authToken) {
    return res
      .status(500)
      .json({ message: 'No authentication token available' });
  }
  try {
    const startTime = Date.now();
    const response = await axios.post(
      `${URL}/search/search`,
      {
        from,
        size,
        text,
        searchEngineId,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
        // params: req.body,
      }
    );
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    console.log(response.data);
    res.send({
      time: `${executionTime}ms`,
      total: response.data.total,
      results: response.data.results,
      maxPage: response.data.maxPage,
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
