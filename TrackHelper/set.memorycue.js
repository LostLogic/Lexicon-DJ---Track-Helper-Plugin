// Iterates through all cuepoints for one or more selected tracks
// If one or more cuepoints match the cueTextMatch, in the given cueTextLocation
// Update the track cue point and set it to a Rekordbox Memory Cue

// Retrieve and process settings
const cueTextMatch = _settings['Memory Cue Text Match'].toLowerCase();
const cueTextLocation = _settings['Text Location'].toLowerCase();
const sortFromPos = parseInt(_settings['Sort from Position'], 10);
const removeCueText = _settings['Remove Cue Text after switch'].toLowerCase();

_helpers.Log(`Searching ${_vars.tracksSelected.length} track(s) for Cue Points with the text "${cueTextMatch}" in the "${cueTextLocation}" location.`);

let tracksUpdated = 0;
let cuepointsUpdated = 0;

for (const track of _vars.tracksSelected) {
  
	_helpers.Log(`Working on track "${track.artist} - ${track.title}": Checking ${track.cuepoints.length} cuepoints.`);
  
	let cuepointsChanged = 0;
	let cueIds = [];
  
	let cuepointMaxPos = 0;
	
	for (const cuepoint of track.cuepoints) {
		let changeToMemoryCue = false;
		
		// Ensure cuepoint.name is always a string to prevent potential errors
		if (typeof cuepoint.name!== 'string') {
			// If name is not a string (null or undefined), set it to an empty string
			cuepoint.name = '';
		}
    
		if(cuepointMaxPos < cuepoint.position && !cuepoint.name.toLowerCase().includes(cueTextMatch)) {
			cuepointMaxPos = cuepoint.position;
		}
	
		switch(cueTextLocation) {
			case 'start':
				if(cuepoint.name.trim().toLowerCase().startsWith(cueTextMatch)) {
					changeToMemoryCue = true;
				}
			break;
			case 'end':
				if(cuepoint.name.trim().toLowerCase().endsWith(cueTextMatch)) {
					changeToMemoryCue = true;
				}
			break;
			case 'any':
				if(cuepoint.name.trim().toLowerCase().includes(cueTextMatch)) {
					changeToMemoryCue = true;
				}
			break;
			default:
				throw new Error(`Warning: Invalid "Text Location": "${cueTextLocation}". Please use "Start", "End" or "Any"`);
			break;
		}
    
		if(changeToMemoryCue) {
			if (typeof cuepoint.data !== 'object' || cuepoint.data === null) {
				cuepoint.data = {};
			}

			if (typeof cuepoint.data.rekordbox !== 'object' || cuepoint.data.rekordbox === null) {
				cuepoint.data.rekordbox = {};
			}
      
			cuepoint.data.rekordbox.originalNum = -1;
      
			if(removeCueText.includes("true")) {
				const regex = new RegExp(cueTextMatch, 'i');
					cuepoint.name = cuepoint.name.replace(regex, "").trim();
			}
      
			cueIds.push({
				id: cuepoint.id,
				name: cuepoint.name,
				startTime: cuepoint.startTime
			});
      
			cuepointsChanged++;
			cuepointsUpdated++;
		}
	}
  
	if(cuepointsChanged > 0) {
		tracksUpdated++;
	}
  
	if(cuepointsChanged > 0 && sortFromPos > 0) {
		// Sort cueIds based on start time and name
		cueIds.sort((a, b) => {
			if (a.startTime !== b.startTime) {
				// Sort by 'startTime'
				return a.startTime - b.startTime;
			} else {
				// If 'startTime' is the same, sort by 'name'
				return a.name.localeCompare(b.name);
			}
		});
    
		let currentSortPos = sortFromPos;
	
		if(currentSortPos <= cuepointMaxPos) {
			currentSortPos = cuepointMaxPos+1;
		}
	
		for(let i = 0; i < cueIds.length; i++) {
			const trackCue = track.cuepoints.find(cue => cue.id === cueIds[i].id);
      
			if(trackCue) {
				trackCue.position = currentSortPos + i;
			}
		}
	}
  
	_helpers.Log(`Changed ${cuepointsChanged} of ${track.cuepoints.length} cuepoints to memory cues for track "${track.artist} - ${track.title}".`);
}
