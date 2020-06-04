
const fs = require('fs');
const path = require('path');
const request = require('request');
const cheerio = require('cheerio');
const os = require('os');
require('chromedriver'); //导入chrome浏览器 driver
const chrome = require('selenium-webdriver/chrome');
const webdriver = require('selenium-webdriver'); //导入selenium 库



const argAcc = process.argv[2];
const argPwd = process.argv[3];

//const outdir = process.argv[3];0
async function  requestFunc(iReq , iOptions) {
    return new Promise ((resolve) => {
        iReq (iOptions , function (err , res , body) {
            if (err) {
                return resolve(false);
            }
            return resolve(body);
        })
    });
}
/**
 * 
 * @param {WebDriver} iDriver 
 * @param {*} acc 
 * @param {*} pwd 
 */
async function seleSchoolLogin (iDriver , acc , pwd) {
    return new Promise (async (resolve) => {
        try {
            iDriver.get("http://system8.ntunhs.edu.tw/myNTUNHS_student/Modules/Main/Index_student.aspx?timeout=false") //打开https://autowebtest.github.io/
            iDriver.sleep(100);
            let inputAcc = await iDriver.findElement({id:'ctl00_loginModule1_txtLOGINID'});
            let inputPwd = await iDriver.findElement({id:'ctl00_loginModule1_txtLOGINPWD'});
            await inputAcc.clear();
            await inputAcc.sendKeys(acc);
            await iDriver.sleep(100);
            await inputPwd.clear();
            await inputPwd.sendKeys(pwd);
            let submitBtn = await iDriver.findElement({id:'btnLogin'});
            await submitBtn.click();
            return resolve([true , iDriver]);
        } catch (e) {
            console.log(e);
            return resolve(false);
        }
    });
    //iDriver.quit();
}

async function selemiumGoToClassList (iDriver) {
    await iDriver.sleep(1000);
    await iDriver.navigate().to('http://system8.ntunhs.edu.tw/myNTUNHS_student/Modules/Profile/qry/Profile_qry_27.aspx');
    let queryFrame = await iDriver.findElement({id : 'ctl00_ContentPlaceHolderQuery_QueryFrame'});
    let detailFrame = await iDriver.findElement({id : 'ctl00_ContentPlaceHolderList_ListFrame'});
    await iDriver.switchTo().frame(queryFrame);
    await iDriver.wait(webdriver.until.elementLocated({id : 'rdoEduSys_1'}) , 15000).click();
    await iDriver.sleep(500);
    let source = await iDriver.getPageSource();
    let $ = cheerio.load(source);
    let faculty = $('select#ddlDept option');
    let facultyList = [];
    for (let i = 0 ; i < faculty.length ; i++) {
        facultyList.push(faculty[i].attribs.value);
    }
    let  schoolClassList , schoolClass,allSpan= ""
    for (let i = 1 ; i < facultyList.length ; i++) { //facultyList.length
        await iDriver.sleep(1000);
        await iDriver.executeScript(`$("#ddlDept").val("${facultyList[i]}").change();`);
        await iDriver.sleep(1000);
        source = await iDriver.getPageSource();
        $ = cheerio.load(source);
        schoolClass = $('select#ddlClass option');
        schoolClassList = [];
        for (let x = 0 ; x < schoolClass.length ; x++) {
            schoolClassList.push(schoolClass[x].attribs.value);
        }
        for (let j = 1; j < schoolClassList.length ; j++) {
            await iDriver.sleep(1000);
            await iDriver.executeScript(`$("#ddlClass").val("${schoolClassList[j]}").change();`);
            await iDriver.sleep(1000);
            source = await iDriver.getPageSource();
            $ = cheerio.load(source);
            await iDriver.switchTo().window(iDriver.getWindowHandle());
            await iDriver.switchTo().frame(detailFrame);
            source = await iDriver.getPageSource();
            $ = cheerio.load(source);
            allSpan = $('span');
            for (let y = 0 ; y < allSpan.length ; y++) {
                //console.log(allSpan[y].children[0].data);
                if (y % 3 == 0 && y > 2) {
                    fs.appendFileSync('測試.csv' , os.EOL,{encoding:'utf-8'});
                }
                fs.appendFileSync('測試.csv' , `${allSpan[y].children[0].data},`,{encoding:'utf-8'});
            }
            fs.appendFileSync('測試.csv' , os.EOL ,{encoding:'utf-8'});
            await iDriver.switchTo().window(iDriver.getWindowHandle());
            await iDriver.switchTo().frame(queryFrame);
        }
    }
}

async function main() {
    let opt = new chrome.Options();
    opt.addArguments('--incognito');
    let driver = await new webdriver.Builder().forBrowser('chrome').setChromeOptions(opt).build(); //创建一个chrome 浏览器实例
    fs.writeFileSync('測試.csv','');
    await seleSchoolLogin(driver,argAcc,argPwd);
    await selemiumGoToClassList(driver);
}
main();