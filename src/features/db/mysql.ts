import mysql, { Pool } from "mysql";
import config from "../../config";

var _maxConnection: number = parseInt(process.env.CONNECTION_COUNT || "1");

var _pool: Pool;
export default {
  connectToServer: function (callback: () => void) {
    _pool = mysql.createPool({
      connectionLimit: _maxConnection,
      ...config.db,
    });
    return callback();
  },

  getConnection: function () {
    return _pool;
  },
};
