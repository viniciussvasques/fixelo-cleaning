SELECT key, value, encode(value::bytea, 'hex') as hex_value FROM "SystemConfig" WHERE key = 'vapid_public_key';
