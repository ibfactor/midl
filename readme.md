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
This is a completely static website.\
You can clone this repository into your website folder and access the index file.\
Alternatively, you can fork this repo and connect it to Cloudflare Pages or Netlify.\
The website has no external dependencies (apart from FontAwesome, for icons, and Ruffle, for Flash emulation, which is fetched from JSDelivr and UNPKG automatically).
You will have to store the game SWF files yourself, as the website currently fetches it from its own CDN (not present in the GitHub repo).
### File Structure
| Folder  | Type/Purpose                                        |
|---------|-----------------------------------------------------|
| images  | All game icons/banners                              |
| scripts | JavaScript files for rendering the main game page   |
| player  | Ruffle emulation and custom loading animation logic |
