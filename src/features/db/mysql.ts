import mysql, { Connection } from "mysql";
import config from "../../config";

var _connection: Connection;

export default {
  connectToServer: function (callback: () => void) {
    _connection = mysql.createConnection(config.db);
    _connection.connect();
    return callback();
  },

  getConnection: function () {
    return _connection;
  },
};
