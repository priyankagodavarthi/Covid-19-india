const express = require("express");
const app = express();
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
const dbStateObjectToResponseObject = (dbObj) => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  };
};
const dbDistrictObjectToResponseObject = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};

//get method
app.get("/states/", async (request, response) => {
  const allStates = `SELECT * FROM state;`;
  const statesArray = await db.all(allStates);
  response.send(
    statesArray.map((eachState) => dbStateObjectToResponseObject(eachState))
  );
});

//get method
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `SELECT * FROM state 
    WHERE state_id=${stateId};`;
  const array = await db.get(stateQuery);
  response.send(dbStateObjectToResponseObject(array));
});
//post method
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postQuery = `INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
    VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(postQuery);
  response.send("District Successfully Added");
});

//get method
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `SELECT * FROM district WHERE 
    district_id=${districtId};`;
  const districts = await db.get(query);
  response.send(dbDistrictObjectToResponseObject(districts));
});

//delete method
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `DELETE FROM district WHERE 
    district_id=${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

//put method
app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateQuery = `UPDATE district
    SET 
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE district_id=${districtId};`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

//get method
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getDetails = `SELECT SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths) FROM district 
    WHERE state_id=${stateId};`;
  const details = await db.get(getDetails);
  response.send({
    totalCases: details["SUM(cases)"],
    totalCured: details["SUM(cured)"],
    totalActive: details["SUM(active)"],
    totalDeaths: details["SUM(deaths)"],
  });
});

//get method
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getName = `SELECT state_name FROM state NATURAL JOIN district 
    WHERE district_id=${districtId};`;
  const name = await db.get(getName);

  response.send({ stateName: name.state_name });
});
module.exports = app;
