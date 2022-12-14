const Session = require("../models/Session");

let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  puppeteer = require("puppeteer");
  // chrome = require("chrome-aws-lambda");
  // puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
}

let options = {};
if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  options = {};
}

let browser;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.mapApi = async (req, res, next) => {
  try {
    if (browser === undefined) {
      console.log("Initializing Browser...");
      browser = await puppeteer.launch();
    } else {
      console.log("Re-using existing Browser...");
    }

    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    // const title = await page.title();

    await page.tracing.start({
      categories: ["devtools.timeline"],
    });

    await page.goto(
      "https://gisweb.casey.vic.gov.au/IntraMaps22A/ApplicationEngine/frontend/mapbuilder/default.htm?configId=2c27b2b9-ee0e-49a8-9462-7085252fdff1&liteConfigId=e8c34f1d-21a3-4144-8926-a3f26ce07798&title=WW91ciUyMFByb3BlcnR5JTIwYW5kJTIwUGxhbm5pbmc=",
      { waitUntil: "load", timeout: 0 }
    );

    await sleep(10000);
    const tracing = JSON.parse(await page.tracing.stop());

    // get session information
    const events = tracing.traceEvents.filter((te) => te.name == "ResourceSendRequest" && te.args.data.url !== undefined);

    await context.close();
    await browser.close();
    browser = undefined;

    for await (const event of events) {
      let eventUrl = event.args.data.url;
      if (eventUrl.includes("IntraMapsSession=") && !eventUrl.includes("IntraMapsSession=null")) {
        const substring = eventUrl.substring(eventUrl.indexOf("IntraMapsSession=") + 17);

        const result = await Session.updateOne({ _id: "63476183533fdef5769ffe55" }, { token: substring }, { new: true });

        if (result.modifiedCount > 0) {
          return res.status(200).send({
            session: substring,
            result: "session updated successfully",
          });
        } else {
          return res.status(400).send({
            session: substring,
            result: "session isn't updated successfully",
          });
        }
      }
    }

    // res.send({
    //     title: title,
    //     tracing: tracing,
    // });
  } catch (err) {
    console.error(err);

    await context.close();
    await browser.close();
    browser = undefined;

    return res.status(400).send(null);
  }
};

// automated not
// exports.scheduleJob = schedule.scheduleJob(
//     "*/30 * * * *",
//     async function (req, res, next) {
//         try {
//             const context = await browser.createIncognitoBrowserContext();
//             const page = await context.newPage();
//             // const title = await page.title();

//             await page.tracing.start({
//                 categories: ["devtools.timeline"],
//             });

//             await page.goto(
//                 "https://gisweb.casey.vic.gov.au/IntraMaps90/ApplicationEngine/frontend/mapbuilder/yourproperty.htm?configId=243fbf74-7d66-4208-899d-91b1d08ff8bf&liteConfigId=b2af2973-160e-4664-8e96-fe701aeaa67f&title=WW91ciBQcm9wZXJ0eSBhbmQgUGxhbm5pbmc%3D",
//                 { waitUntil: "load", timeout: 0 }
//             );

//             await sleep(10000);
//             const tracing = JSON.parse(await page.tracing.stop());

//             // get session information
//             const events = tracing.traceEvents.filter(
//                 (te) =>
//                     te.name == "ResourceSendRequest" &&
//                     te.args.data.url !== undefined
//             );

//             for await (const event of events) {
//                 let eventUrl = event.args.data.url;
//                 if (
//                     eventUrl.includes("IntraMapsSession=") &&
//                     !eventUrl.includes("IntraMapsSession=null")
//                 ) {
//                     const substring = eventUrl.substring(
//                         eventUrl.indexOf("IntraMapsSession=") + 17
//                     );

//                     await Session.updateOne(
//                         { _id: "63476183533fdef5769ffe55" },
//                         { token: substring }
//                     );

//                     // if (result.modifiedCount > 0) {
//                     //     return res.status(200).send({
//                     //         session: substring,
//                     //         result: "session updated successfully",
//                     //     });
//                     // } else {
//                     //     return res.status(400).send({
//                     //         session: substring,
//                     //         result: "session isn't updated successfully",
//                     //     });
//                     // }
//                 }
//             }

//             await context.close();
//         } catch (err) {
//             console.error(err);
//             return res.status(400).send(null);
//         }
//     }
// );

exports.getToken = async (req, res, next) => {
  try {
    const result = await Session.findOne({
      _id: "63476183533fdef5769ffe55",
    });
    if (!result)
      return res.status(400).send({
        session: result,
        result: "session isn't getting successfully",
      });

    res.status(200).send({
      session: result,
      result: "session getting successfully",
    });
  } catch (error) {
    next({ error: error, message: "Something went wrong" });
  }
};
