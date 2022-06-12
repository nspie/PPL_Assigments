import * as R from "ramda";

function averageGradesOver60(grades: number[]) {
    let gradesSum = 0;
    let counter = 0;
    for (let i = 0; i < grades.length; i++) {
    if (grades[i] > 60) {
    gradesSum += grades[i];
    counter++;
    }
    }
    return gradesSum / counter;
    }

const FPaverageGradesOver60 : (grades: number[]) => number = function (grades : number[]) : number {

let gradesSum : number = R.reduce((acc : number, curr : number) => ( curr > 60) 
? acc + curr : acc , 0, grades);

let counter : number = R.reduce((acc : number, curr : number) => ( curr > 60) 
? acc + 1 : acc , 0, grades);

return gradesSum / counter; 

}

console.log(averageGradesOver60([70,80,90]));
