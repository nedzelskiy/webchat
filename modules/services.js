/**
 * return extension of file
 */
function getExt(filename) {
    return filename.split('.').pop().toLowerCase();
};

exports.getExt = getExt;
