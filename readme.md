<div align="center">
  <img src="/midl.png">
</div>
<hr>
<p>Runs on Vanilla JS/HTML/CSS</p>
<p>A ready to use version can be accessed at https://midl.ibfr.org</p>

### Features
- Flash emulation via Ruffle
- Downloading and loading of game save files
- Search function
- ANIMATIONS!
### Planned Features
  - Saving game state (as it is)
  - Cloud storage functionality
  - Emulators!
### Note Regarding Games
All games were taken from InternetArchive, effort was made to ensure no site locked games were included (no site locks were bypassed).
### Self-Hosting
MIDL runs on NodeJS Express & LowDB.\
You can clone this repository.
```
git clone https://github.com/ibfactor/midl.git
```
Then install the required NPM packages and run the server.
```
npm install && npm run start
```
By default, the server will launch at `http://localhost:8088`, you can change the port in settings, but that is not recommended, as the MIDL cdn only allows CORS headers for the `8088` port.
To host your own public instance, you will have to store the game SWF files yourself, as the website currently fetches it from its own CDN (not present in the GitHub repo).
### File Structure
| Folder  | Type/Purpose                                        |
|---------|-----------------------------------------------------|
| images  | All game icons/banners                              |
| scripts | JavaScript files for rendering the main game page   |
| player  | Ruffle emulation and custom loading animation logic |
