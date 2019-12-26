const xlsx = require('../utils/xlsx');
const path = require('path');
const file = path.join(__dirname, 'feature_api.xlsx');
const Api = require('../models-master').I2gApi;
module.exports = async function () {
    let rows = xlsx.getRows(file, 'feature_api').slice(2);
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let route = await Api.findOrCreate({
            where: {
                idI2gApi: row[0]
            }
        });
        await route[0].update({
            route: row[1],
            type: row[2],
        });
        for (let i = 1; i <= 10; i++) {
            await route[0].addI2g_feature(i, {through: {perm: row[2 + i]}});
        }
    }
    console.log("Synced feature/api permission")
};