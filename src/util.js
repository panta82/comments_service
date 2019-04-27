const lodash = require("lodash");

function assign(target, ...sources) {
  return lodash.merge(target, ...sources);
}

module.exports = {
  assign
};
