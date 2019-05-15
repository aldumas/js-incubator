function dominantDirection(text) {
  let codePoints = [];
  for (let char of text) {
    codePoints.push(char.codePointAt(0));
  }
  
  const NONE_GROUP = "NONE";
  const NONE = {direction: NONE_GROUP};
  let scripts = codePoints.map(codePoint => characterScript(codePoint) || NONE);
  
  let groups = countBy(scripts, script => script.direction)
  	.filter(group => group.name !== NONE_GROUP);
  
  let maxGroup = groups.reduce((max, group) => {
      if (group.count > max.count) {
        max.name = group.name;
        max.count = group.count;
      }
      return max;
    },
    {name: null, count: -1});

  return maxGroup.name;
}