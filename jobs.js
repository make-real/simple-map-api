const schedule = require("node-schedule");

schedule.scheduleJob("*/30 * * * *", function () {
    console.log("The answer to life, the universe, and everything!");
});
