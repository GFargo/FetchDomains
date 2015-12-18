module.exports = {
    get: function (key, callback) {
        var filePath = path.resolve(tmpDir + "/" + key);
        console.log("Get data from path: " + filePath);

        fs.exists(filePath, function (exists) {
            if (exists) {
                fs.readFile(filePath, "utf-8", callback);
            } else {
                callback();
            }
        });
    },

    set: function (key, value, callback) {
        var filePath = path.resolve(tmpDir + "/" + key);
        console.log("Write data to path: " + filePath);

        fs.writeFile(filePath, value, "utf-8", function () {
            callback && callback();
        });
    },

    invalidate: function () {}
};