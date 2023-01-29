// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: magic;


/**
 * Adapt the default here!
 * 
 * `DEFAULT_WIDGET_MODE` is either display all teams of each category in ranked order or a single team
 * Value can be `TEAM` or `ALL_TEAMS`.
 * 
 * `DEFAULT_CATEGORY` is either the category Imoca or VO65, which can be choosen when selected "ALL_TEAMS" as widget-mode.
 * Value can be `IMOCA` or `VO65`
 * 
 * `DEFAULT_TEAM` is a single team which can be choosen, when selected "TEAM" as widget-mode.
 * Value can be:
 * GUYO
 * BIOT
 * HOLC
 * 11TH
 * MALI
 * AUST
 * WHIS
 * JAJO
 * BALT
 * MIRU
 * MEXI
 */
const DEFAULT_WIDGET_MODE = 'TEAM';
const DEFAULT_CATEGORY = 'IMOCA';
const DEFAULT_TEAM = 'MALI';

/**
 * Do not touch this!
 */
const params = args.widgetParameter?.split(',');
const WIDGET_MODE = params?.[0] || DEFAULT_WIDGET_MODE;
const BOAT_CATEGORY = params?.[1] || DEFAULT_CATEGORY;
const TEAM_CODE = params?.[1] || DEFAULT_TEAM;

const STYLING = {
  backgroundColor: Device.isUsingDarkAppearance() ? '#1c1c1c' : '#ffffff',
  textColor: Device.isUsingDarkAppearance() ? '#ffffff' : '#1c1c1c',
  headlineFontSize: WIDGET_MODE === 'TEAM' ? 16: 14,
  bodyFontSize: 12,
  infoFontSize: 8
}

const isGermanLanguage = Device.language() === 'de';

function getTeam(latestUpdate, code = TEAM_CODE) {
  let boats = [];
  latestUpdate.race.leg.ranking.class.forEach(c => {
    boats = [...boats, ...c.boat]
  });

  return boats.find((boat) => boat.code === code);
}

function getBoatsOfClass(latestUpdate, code = BOAT_CATEGORY) {
  const type = latestUpdate.race.leg.ranking.class.find((c) => c.name === code);
  return type.boat;
}

function getDistanceDoneInPercent(latestUpdate, boat) {
  const fullDistance = parseFloat(latestUpdate.race.leg.ranking.class[0].distance);

  if (boat.dtf && fullDistance) {
    const completedDistance = fullDistance - parseFloat(boat.dtf);
    return Math.abs(completedDistance * 100 / fullDistance).toFixed(2);
  }

  return null;
}

function addText(widget, text, size = STYLING.bodyFontSize, style = 'regular') {
  const widgetText = widget.addText(text);

  if (style === 'bold') {
    widgetText.font = Font.boldRoundedSystemFont(size);
  } else {
    widgetText.font = Font.regularRoundedSystemFont(size);
  }

  widgetText.textColor = new Color(STYLING.textColor);
}

async function getLatestOceanRaceUpdate() {
  const url = "https://tracker.theoceanrace.com/json/latest-report/latest.json";
  const request = new Request(url);
  const response = await request.loadJSON();
  return response;
}

async function createWidget() {
  const latestOceanRaceUpdate = await getLatestOceanRaceUpdate();
  const lastRaceUpdate = new Date(latestOceanRaceUpdate.race.leg.ranking.modification);
  const team = getTeam(latestOceanRaceUpdate);

  const listwidget = new ListWidget();
  listwidget.backgroundColor = new Color(STYLING.backgroundColor);

  if (WIDGET_MODE === 'TEAM') {
    addText(listwidget, latestOceanRaceUpdate.race.name);
    listwidget.addSpacer(2)

    addText(listwidget, `${team.name.slice(0, 14)}${team.name.length > 14 ? '...' : ''}`, STYLING.headlineFontSize, 'bold')
    listwidget.addSpacer(6);

    const rankPlaceCopy = isGermanLanguage ? "Platz" : "place";
  
    addText(listwidget, `⛵️ ${team.rank}${isGermanLanguage ? '.' : team.rank === '1' ? 'st' : 'th'} ${rankPlaceCopy}`)
    listwidget.addSpacer(4);

    if(team.status === 'RAC') {
      if (team.instant.speed) {
        addText(listwidget, `💨 ${team.instant.speed} kts`)
        listwidget.addSpacer(4);
      }
  
      if (team.dtl && team.dtl !== '0.00') {
        addText(listwidget, `👀 ${team.dtl} nm`)
        listwidget.addSpacer(4);
      }
  
      if (team.dtf) {
        addText(listwidget, `🏁 ${team.dtf} nm`)
        listwidget.addSpacer(4)
      }
    } else {
      addText(listwidget, isGermanLanguage ? 'Das Team hat das Ziel erreicht.' : 'The team has finished.')
    }

  } else if (WIDGET_MODE === 'ALL_TEAMS') {
    addText(listwidget, latestOceanRaceUpdate.race.name, STYLING.headlineFontSize, 'bold');
    listwidget.addSpacer(4);

    getBoatsOfClass(latestOceanRaceUpdate).forEach((team, index) => {
      addText(listwidget, `${team.rank}. ${team.name.slice(0, 16)}${team.name.length > 14 ? '...' : ''}`);
      if (team.length !== index + 1) {
        listwidget.addSpacer(2);
      }
    });

  } else {
    addText(listwidget, `⚠️ Please, select a display type!`);
  }

  listwidget.addSpacer(4);
  addText(listwidget, `${isGermanLanguage ? 'Update vom' : 'Last Update'} ${lastRaceUpdate.toLocaleDateString()}, ${lastRaceUpdate.toLocaleTimeString(undefined, { hour: "numeric", minute: "numeric" })}`, STYLING.infoFontSize);

  return listwidget;
}

const widget = await createWidget();

// Check where the script is running
if (config.runsInWidget) {
  // Runs inside a widget so add it to the homescreen widget
  Script.setWidget(widget);
} else {
  // Show the medium widget inside the app
  widget.presentSmall();
}
Script.complete();
