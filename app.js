/// start the server in this file
const PORT = process.env.PORT || 3000;

const app = require("./server");


app.listen(PORT, () => {
  console.log(`Server started and ruuning on ${PORT} port`);
});