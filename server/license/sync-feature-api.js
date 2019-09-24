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
        }).then(async rs => {
            let route = rs[0].toJSON();
            for (let i = 1; i <= 10; i++) {
                await rs[0].addI2g_feature(i, {through: {perm: row[2 + i]}});
                console.log("Added for ", rs[0].route);
            }
            console.log("Done all api-feature sync")
        })
    })
};