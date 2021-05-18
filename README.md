# Buoy Productivity

electron productivity app

## Getting started

1. clone repo
2. enter folder in cmd and run:
3. > npm init
4. > npm install
5. > npm run buoy

## Important Dependencies

- VISUAL STUDIO COMMUNITY 2019 + C++ packages
- > npm i electron-active-window

## Next Steps
<<<<<<< Updated upstream
- [ ] check window class not window name -> active window supplies window class -> window class possible in electron capturer? use this instead https://www.npmjs.com/package/@josephuspaye/list-open-windows
=======

- [ ] check window class not window name -> active window supplies window class -> window class possible in electron capturer?
>>>>>>> Stashed changes
- [ ] tag manager functionality -> add button hidden till tag input, when input unhide add button, onclick add input as tag to list of tags
- [ ] buoy tag functionality -> display list of created tags in buoy tag dropdown, implement possibility to add tag to buoy, display added tag on svg or as poppover
- [ ] database: write and read tags 
- [ ] make focus check work
      - append checked programs to list/array/ other data structure probably inside of intervall that continuosly executes until start is pressed then terminates
      - in main timer -> check if active window name (or window class?) is in list of checked focus programs
      - implement 10s warning screen / alert / message / ...
- [ ] create custom alert when timer terminates -> use it instead of alert()
- [ ] database: write status, duration, focus, used tag
- [ ] database: read status, duration, focus, used tag and output values to console to debug on hover over circles
- [ ] implement database search
- [ ] ...


## Stretch Goals

- localisation
- calendar
- ...
