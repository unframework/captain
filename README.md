# Captain

Using `node-gphoto2` on Raspberry Pi running Ubuntu, which means prerequisites:

- Node v0.10.28 (newer not supported by the module)
- manually compiled libgphoto2 (npm won't install module with stock gphoto2 v2.4 dev package)

Working with Canon Rebel over USB.

```
npm install
node index.js 15 5000 # <frames> <delay-millis>
```
