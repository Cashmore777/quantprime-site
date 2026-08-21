/**
 * Quant Prime X/Twitter Auto-Poster
 * Posts one tweet per hour from the tweet pool
 * 
 * Setup:
 * 1. npm install twitter-api-v2
 * 2. Set environment variables or create .env file
 * 3. node x-scheduler.js
 */

const fs = require('fs');
const path = require('path');

// Config
const CONFIG = {
  tweetsFile: path.join(__dirname, 'x-tweets.json'),
  stateFile: path.join(__dirname, 'x-state.json'),
  postIntervalMs: 60 * 60 * 1000, // 1 hour
  shuffle: true, // Randomize order
  dryRun: process.env.DRY_RUN === 'true' // Set DRY_RUN=true to test without posting
};

// Twitter API credentials (set via environment variables)
const TWITTER_CONFIG = {
  appKey: process.env.TWITTER_APP_KEY || process.env.X_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET || process.env.X_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN || process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET || process.env.X_ACCESS_SECRET
};

// Load state
function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
    }
  } catch (e) {
    console.log('No existing state, starting fresh');
  }
  return { lastIndex: -1, posted: [], shuffledOrder: null };
}

// Save state
function saveState(state) {
  fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
}

// Load tweets
function loadTweets() {
  const data = JSON.parse(fs.readFileSync(CONFIG.tweetsFile, 'utf8'));
  return data.tweets;
}

// Shuffle array (Fisher-Yates)
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Get next tweet
function getNextTweet(tweets, state) {
  // Initialize or reset shuffled order if needed
  if (!state.shuffledOrder || state.lastIndex >= state.shuffledOrder.length - 1) {
    console.log('Shuffling tweet order...');
    state.shuffledOrder = CONFIG.shuffle 
      ? shuffle([...Array(tweets.length).keys()]) 
      : [...Array(tweets.length).keys()];
    state.lastIndex = -1;
  }
  
  state.lastIndex++;
  const tweetIndex = state.shuffledOrder[state.lastIndex];
  return { 
    tweet: tweets[tweetIndex], 
    index: tweetIndex,
    position: state.lastIndex + 1,
    total: tweets.length
  };
}

// Post tweet
async function postTweet(text) {
  if (CONFIG.dryRun) {
    console.log(`[DRY RUN] Would post: ${text}`);
    return { success: true, dryRun: true };
  }
  
  // Check for API credentials
  if (!TWITTER_CONFIG.appKey || !TWITTER_CONFIG.accessToken) {
    console.error('Missing Twitter API credentials. Set environment variables:');
    console.error('  TWITTER_APP_KEY, TWITTER_APP_SECRET');
    console.error('  TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET');
    return { success: false, error: 'Missing credentials' };
  }
  
  try {
    const { TwitterApi } = require('twitter-api-v2');
    const client = new TwitterApi({
      appKey: TWITTER_CONFIG.appKey,
      appSecret: TWITTER_CONFIG.appSecret,
      accessToken: TWITTER_CONFIG.accessToken,
      accessSecret: TWITTER_CONFIG.accessSecret
    });
    
    const result = await client.v2.tweet(text);
    console.log(`✓ Posted tweet: ${result.data.id}`);
    return { success: true, tweetId: result.data.id };
  } catch (error) {
    console.error('Error posting tweet:', error.message);
    return { success: false, error: error.message };
  }
}

// Main scheduler
async function runScheduler() {
  console.log('=================================');
  console.log('Quant Prime X Auto-Poster');
  console.log('=================================');
  console.log(`Mode: ${CONFIG.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Interval: ${CONFIG.postIntervalMs / 1000 / 60} minutes`);
  console.log('');
  
  const tweets = loadTweets();
  console.log(`Loaded ${tweets.length} tweets`);
  
  let state = loadState();
  console.log(`Resume from index: ${state.lastIndex}`);
  console.log('');
  
  // Post immediately on start
  const postOne = async () => {
    const { tweet, index, position, total } = getNextTweet(tweets, state);
    console.log(`[${new Date().toISOString()}] Posting ${position}/${total}:`);
    console.log(`  "${tweet.substring(0, 50)}..."`);
    
    const result = await postTweet(tweet);
    
    if (result.success) {
      state.posted.push({
        index,
        text: tweet,
        postedAt: new Date().toISOString(),
        tweetId: result.tweetId
      });
      saveState(state);
    }
    
    console.log('');
  };
  
  // Post first one
  await postOne();
  
  // Schedule hourly posts
  setInterval(postOne, CONFIG.postIntervalMs);
  
  console.log('Scheduler running. Press Ctrl+C to stop.');
}

// Run if executed directly
if (require.main === module) {
  runScheduler().catch(console.error);
}

module.exports = { loadTweets, getNextTweet, postTweet };
