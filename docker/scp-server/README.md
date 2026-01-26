### Access Files on balena device 

**In terminal:**
`balena tunnel 4108ac2 -p 22:5400`

**Use FTP Client (Transmit)**
````
Server: localhost
Benutzername: root
Password: $SCP_PASSWORD
Port: 5400
````

**docker-compose.yml**
```` 
  scp-server:
    network_mode: host
    restart: always
    build: ./scp-server
    privileged: false
    labels:
      io.balena.features.dbus: 1
    volumes:
      - 'shared-data:/root/shared-data'
    ports:
      - "22:22/udp"
      - "22:22/tcp"
````