require('dotenv').config();
const express = require('express');
const axios = require('axios');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const cron = require('cron'); 
let fetch;

const app = express();
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIo(server);

const routes = require('./src/routes/api.routes');
const sensorModel = require('./src/models/sensors.model'); 
const errorHandler = require('./src/middleware/errorHandler');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'graph.html'));
});

app.get('/detail', async (req, res) => {
  try {
    const data = await sensorModel.getAllSensorData();
    res.render('detail', { data });
  } catch (error) {
    res.status(500).send('Error retrieving data');
  }
});

io.on('connection', (socket) => {
  console.log('Client kết nối');
  socket.on('disconnect', () => {
    console.log('Client ngắt kết nối');
  });
});

const ADA_USERNAME = process.env.ADA_USERNAME;
// Ở đây chỉ đọc nên không cần ADA KEY
const ADAFRUIT_IO_KEY = process.env.ADAFRUIT_IO_KEY;

const headers = {
  'X-AIO-Key': ADAFRUIT_IO_KEY,
  'Content-Type': 'application/json'
};

// Nên thêm 1 số feeds
const feeds = [
  // 'airquality',
  'humidity',
  // 'lightintensity',
  // 'motion',
  // 'pressure',
  'temperature'
];
/** Tui viết document hàm này cho mn dễ hình dung 
FetchAllFeeds
========================================================
Ở đây mình sẽ lấy data mới nhất từ mỗi feed sau đó ghi data vào database,
Và cấu hình database chỗ table sensor phải được insert trước và tui nghĩ cũng nên inser trước những thứ sẽ đo
Tui có để cái insert trong file sql á (là mẫu thôi nên cái thiết bị cảm biến bị sai mn có thể sửa lại)
Sau đó có thể real-time cho client qua socket.io.

1. Duyệt qua từng feed trong array "feeds".
2. Gửi request GET đến endpoint Adafruit IO để lấy data
3. Nếu có data:
    - Parse giá trị và thời gian tạo.
    - Truy vấn sensor theo type
    - Tìm được sensor:
        - Ghi data vào DB bằng model "createSensorData".
        - Phát dữ liệu mới đến client qua socket "newData". (đoạn này chưa test :(()
    - Không tìm thấy sensor: => In error
  4. Request thất bại, log lỗi ra.
  5. Vì muốn gọi đồng thời nên dùng "Promise.all" để xử lý multi.

Một số note khác tui có comment ở trong file này và khác :| mn xem và tinh chỉnh dễ cho việc mn test nha
 */
async function fetchAllFeeds() {
  try {
    const feedPromises = feeds.map(async (currentFeed) => {
      // console.log(`=== Lấy dữ liệu từ feed: ${currentFeed} ===`);
      const url = `https://io.adafruit.com/api/v2/${ADA_USERNAME}/feeds/dadn.${currentFeed}/data?limit=1`;
      try {
        const response = await axios.get(url, { headers });
        // const response = await axios.get(url);
        const data = response.data;
        if (data && data.length > 0) {
          const record = data[0];
          const feedValue = parseFloat(record.value);
          const createdAt = record.created_at;
          // console.log(`Feed: ${currentFeed} | Giá trị: ${feedValue} | Thời gian: ${createdAt}`);

          const sensorRecord = await sensorModel.getSensorByType(currentFeed);
          
          if (sensorRecord) {
            const sensorId = sensorRecord.sensor_id;
            const payload = {
              sensor_id: sensorId,
              svalue: feedValue,
              recorded_time: createdAt
            };
            // Ở hàm này nếu mn không muốn in ra thì vào trong models comment lại
            const insertResult = await sensorModel.createSensorData(payload);
            // console.log(`Dữ liệu được lưu cho sensor_type "${currentFeed}" (sensor_id: ${sensorId}):`, insertResult);

            io.emit('newData', { feed: currentFeed, value: feedValue, created_at: createdAt });
          } else {
            console.error(`Không tìm thấy sensor nào với sensor_type: ${currentFeed}`);
          }
        } else {
          console.log(`Không có dữ liệu từ feed "${currentFeed}"`);
        }
      } catch (error) {
        console.error(`Lỗi khi fetch dữ liệu từ feed "${currentFeed}":`, error.message);
      }
    });

    await Promise.all(feedPromises);
  } catch (err) {
    console.error('Lỗi khi fetch dữ liệu từ Adafruit IO:', err.message);
  }
}

// Timer, nên tăng lên nha vì ADA nó có giới hạn số request trên 1 thời gian nhất định, để tầm 1s là đẹp á
setInterval(fetchAllFeeds, 2000);

app.use(errorHandler);

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
