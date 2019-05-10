async function PleaseWaitForMe() {
    console.log("Entered PleaseWaitForMe");
    setTimeout(() => {console.log("PleaseWaitForMe finished task");}, 5000);
    console.log("Leaving PleaseWaitForMe");
  }
  
  async function ReallyWaitForMe() {
    console.log("Entered ReallyWaitForMe");
    console.log("Leaving ReallyWaitForMe; returning a Promise");
    return new Promise(resolve => {
      setTimeout(() => {
        console.log("ReallyWaitForMe finished task; resolving");
        resolve();
        console.log("ReallyWaitForMe resolved");
      }, 5000);
    });
  }
  
  async function CourteousFunc() {
    console.log("Entered CourteousFunc");
    // this suspends this function but will resume as soon as the stack clears
    // because PleaseWaitForMe() actually already completed. It did not return
    // a Promise or await some other async function.
    await PleaseWaitForMe();
    console.log("Leaving CourteousFunc");
  }
  
  async function ReallyCourteousFunc() {
    console.log("Entered ReallyCourteousFunc");
    // this will really wait, because a Promise is returned. It would also work
    // if ReallyWaitForMe() ended up calling await, itself.
    await ReallyWaitForMe();
    console.log("Leaving ReallyCourteousFunc");
  }
  
  function RudeFunc() {
    console.log("Entered RudeFunc");
    PleaseWaitForMe(); // I think not!
    console.log("Leaving RudeFunc")
  }
  
  console.log("------------");
  //ReallyCourteousFunc();
  CourteousFunc();
  //RudeFunc();