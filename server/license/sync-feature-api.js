const xlsx = require('../utils/xlsx');
const path = require('path');
const file = path.join(__dirname, 'feature_api.xlsx');
const Api = require('../models-master').I2gApi;
module.exports = function () {
    let rows = xlsx.getRows(file, 'feature_api').slice(2);
    rows.forEach(row => {
        Api.findOrCreate({
            where: {
                idI2gApi: row[0],
                route: row[1],
                type: row[2]
            }, defaults: {
                idI2gApi: row[0],
                route: row[1],
                type: row[2]
            }
        }).then(rs => {

        })
    })
};