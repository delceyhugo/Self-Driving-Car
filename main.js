const carCanvas = document.querySelector('#carCanvas')
carCanvas.width = 200
const networkCanvas = document.querySelector('#networkCanvas')
networkCanvas.width = 300


var param
if(localStorage.getItem('parameter')){
    param = JSON.parse(localStorage.getItem('parameter'))
    for (const property in param) {
        document.querySelector('#' + property) !== null ? document.querySelector('#' + property).value = param[property] : null
    }
}else{
    param = {
        network: 500,
        trafficLength: 5,
        laneCount: 3,
        control: 'AI',
        speed: 3,
        mutationRate: 0.1
    }
}


const carCtx = carCanvas.getContext('2d')
const networkCtx = networkCanvas.getContext('2d')

const road = new Road (carCanvas.width/2, carCanvas.width*0.9, param.laneCount)

const cars = generateCars(param.network, param.speed)
let bestCar = cars[0]


let traffic = generateRandomTraffic(param.trafficLength)


let isPaused = false

function togglePause(){
    isPaused = !isPaused
}


function setParameter(target){
    param[target] = parseFloat(document.querySelector('#' + target).value)
    localStorage.setItem('parameter', JSON.stringify(param))
    if(target == 'laneCount' || 'trafficLength') trafficDiscard()
    window.location.reload();
}




if(localStorage.getItem('bestBrain')){
    for (let i = 0; i < cars.length; i++) {
        cars[i].brain = JSON.parse(localStorage.getItem('bestBrain'))
        if(i != 0) NeuralNetwork.mutate(cars[i].brain, param.mutationRate)
    }
}
if(localStorage.getItem('traffic')){
    traffic = rehydrateSavedTraffic(JSON.parse(localStorage.getItem('traffic')))
}


const savedTrafficData = []
for (let i = 0; i < traffic.length; i++) {
    savedTrafficData.push({
        x: traffic[i].x,
        y: traffic[i].y,
        width: traffic[i].width,
        height: traffic[i].height,
        speed: traffic[i].maxSpeed
    })
    
}








function rehydrateSavedTraffic(savedTraffic){
    const traffic = []
    for (let i = 0; i < savedTraffic.length; i++) {
        traffic.push(new Car(savedTraffic[i].x, savedTraffic[i].y, savedTraffic[i].width, savedTraffic[i].height, 'DUMMY', savedTraffic[i].speed))
    }
    return traffic
}


function generateRandomTraffic(lineOfTraffic, speed){
    const traffic = []
    for (let i = 1; i < lineOfTraffic*2; i+=2) {
        let numOfCars = Math.floor(Math.random() * road.laneCount)
        let numOfLine = [0,1,2]
        for (let j = 0 ; j < numOfCars; j++) {
            if(speed !== undefined){
                traffic.push(new Car(road.getLaneCenter(numOfLine.splice(Math.floor(Math.random() * numOfLine.length-1), 1)), -i*100, 30, 50, 'DUMMY', speed))
            } 
            else{
                let row = numOfLine.splice(Math.floor(Math.random() * numOfLine.length-1), 1)
                traffic.push(new Car(road.getLaneCenter(row), -i*100, 40, 70, 'DUMMY', [2.5, 2.1, 1.8, 1.5].at(row)))
            }
            
        }
    }
    return traffic
}


var fps = [];



animate()




function trafficSave(){
    localStorage.setItem('traffic', JSON.stringify(savedTrafficData))
}
function trafficDiscard(){
    localStorage.removeItem('traffic')
}
function save(){
    localStorage.setItem('bestBrain', JSON.stringify(bestCar.brain))
}
function discard(){
    localStorage.removeItem('bestBrain')
}
function generateCars(N, speed = 3){
    const cars = []
    for (let i = 0; i < N; i++) {
        cars.push(new Car(road.getLaneCenter(1), 100, 40, 70, 'AI', speed))
    }
    return cars
}





function animate(time){
    if(!isPaused){
        for (let i = 0; i < traffic.length; i++) {
            traffic[i].update(road.borders, [])
        }
        for (let i = 0; i < cars.length; i++) {
            cars[i].update(road.borders, traffic)
        }
        bestCar = cars.find(c => c.y == Math.min(...cars.map(c => c.y)))
        carCanvas.height = window.innerHeight
        networkCanvas.height = window.innerHeight
        carCtx.save()
        carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7)
        road.draw(carCtx)
        for (let i = 0; i < traffic.length; i++) {
            traffic[i].draw(carCtx)
        }
        carCtx.globalAlpha = 0.2
        for (let i = 0; i < cars.length; i++) {
            cars[i].draw(carCtx)
        }
        carCtx.globalAlpha = 1
        bestCar.draw(carCtx, true)
        carCtx.restore()
        networkCtx.lineDashOffset = -time/50
        Visualizer.drawNetwork(networkCtx, bestCar.brain)
        const now = performance.now()
        while (fps.length > 0 && fps[0] <= now - 1000) {
            fps.shift();
        }
        fps.push(now);
        Visualizer.drawFps(networkCtx, fps.length)

    }
    requestAnimationFrame(animate)
}