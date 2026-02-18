const fs = require('fs');
const path = require('path');

function logReport_TwoData(errorType, dataName, data1, dataName2, data2){
    const logPath = path.join(__dirname, 'report.txt');
    const timestamp = new Date().toLocaleString('tr-TR');

    const logMessage = `[${timestamp}] [${errorType}]- ${dataName}: ${JSON.stringify(data1)}, ${dataName2}: ${JSON.stringify(data2)}\n`;
    fs.appendFileSync(logPath, logMessage);
}

function logReportWithErrorMessage(errorType, errorMessage){
    const logPath = path.join(__dirname, 'report.txt');
    const timestamp = new Date().toLocaleString('tr-TR');
    
    const logMessage = `[${timestamp}] [${errorType}]- ${errorMessage}\n`;
    fs.appendFileSync(logPath, logMessage);
}

module.exports = {
    logReport_TwoData
    , logReportWithErrorMessage
}