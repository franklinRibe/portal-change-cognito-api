import json
import logging
from datetime import datetime


class JsonFormatter(logging.Formatter):
    def format(self, record):
        log = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Se o logger recebeu campos extra (como 'user', 'password', etc)
        if hasattr(record, "extra_data"):
            log.update(record.extra_data)

        return json.dumps(log)
