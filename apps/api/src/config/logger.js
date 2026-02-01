import winston from 'winston';

class MariaDbTransport extends winston.Transport {
  log(info, callback) {
    setImmediate(async () => {
      this.emit('logged', info);
      
      if (info.level === 'info' && info.isAudit) {
        try {
          const { AuditLog } = await import('../models/index.js');
          
          await AuditLog.create({
            userId: info.userId,
            action: info.action,
            resource: info.resource,
            details: info.details || {},
            ipAddress: info.ip,
            userAgent: info.userAgent
          });
        } catch (err) {
          console.error('Audit Log Error:', err);
        }
      }
    });

    callback();
  }
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new MariaDbTransport()
  ],
});

export default logger;