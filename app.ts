import express, { Request, Response } from 'express';
import prisma  from './prisma/prisma';


const app = express();
app.use(express.json());

// Get all users
app.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Create a user
app.post('/users', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  try {
    const newUser = await prisma.user.create({
      data: { name, email, password },
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
});


// Update User Role Route
app.put('/user/:id/role', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    try {
        // Check if the role is provided
        if (!role) {
            return res.status(400).json({ message: 'Role is required' });
        }

        // Find the user by ID
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user's role
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role },
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Get all vehicles
app.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching vehicles' });
  }
});

// Create a vehicle
app.post('/vehicles', async (req: Request, res: Response) => {
  const { driverId, licensePlate, vehicleType } = req.body;
  try {
    const newVehicle = await prisma.vehicle.create({
      data: { driverId, licensePlate, vehicleType, maintenance: [], malfunctions: []},
    });
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(500).json({ error: 'Error creating vehicle', message: error});
  }
});

// Get all requests
app.get('/requests', async (req: Request, res: Response) => {
  try {
    const requests = await prisma.request.findMany();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching requests' });
  }
});

// Create a request
app.post('/vehicles', async (req: Request, res: Response) => {
  const { driverId, licensePlate, vehicleType, maintenance, malfunctions, currentMission, location, speed, status } = req.body;

  // Validate required fields
  if (!driverId || !licensePlate || !vehicleType) {
    return res.status(400).json({ error: 'Missing required fields: driverId, licensePlate, and vehicleType are required.' });
  }

  try {
    const newVehicle = await prisma.vehicle.create({
      data: {
        driverId,
        licensePlate,
        vehicleType,
        maintenance: maintenance || {},       // Ensure it's valid JSON or set an empty object
        malfunctions: malfunctions || {},     // Ensure it's valid JSON or set an empty object
        currentMission: currentMission || null, // Optional field
        location: location || null,             // Optional field
        speed: speed || 0,                      // Optional field with default value
        status: status || 'active',             // Optional field with default value
      },
    });
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(500).json({ error: 'Error creating vehicle', message: error });
  }
});



// Get all vehicle metrics
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await prisma.obd.findMany();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching vehicle metrics' });
  }
});

// Create a new vehicle metrics entry
app.post('/metrics', async (req: Request, res: Response) => {
  const data = req.body;
  try {
    const newMetrics = await prisma.obd.create({
      data: {
        vehicle_id: data.vehicle_id || null,
        engineRpm: data.engineRpm || null,  // Default to null if not provided
        vehicleSpeed: data.vehicleSpeed || null,
        throttlePosition: data.throttlePosition || null,
        fuelLevel: data.fuelLevel || null,
        shortTrim1: data.shortTrim1 || null,
        longTrim1: data.longTrim1 || null,
        shortTrim2: data.shortTrim2 || null,
        longTrim2: data.longTrim2 || null,
        engineLoad: data.engineLoad || null,
        intakeAirTemperature: data.intakeAirTemperature || null,
        massAirFlow: data.massAirFlow || null,
        fuelPressure: data.fuelPressure || null,
        fuelConsumptionRate: data.fuelConsumptionRate || null,
        engineCoolantTemperature: data.engineCoolantTemperature || null,
        oxygenSensorReading: data.oxygenSensorReading || null,
        catalystTemperature: data.catalystTemperature || null,
        evapEmissionControlPressure: data.evapEmissionControlPressure || null,
        diagnosticTroubleCode: data.diagnosticTroubleCode || null,
        batteryVoltage: data.batteryVoltage || null,
        oilTemperature: data.oilTemperature || null,
        distanceTraveled: data.distanceTraveled || null,
        time: data.time ? new Date(data.time) : undefined,  // Convert to Date if provided
      },
    });
    res.status(201).json(newMetrics);
  } catch (error) {
    res.status(500).json({ error: 'Error creating vehicle metrics entry', message: error });
  }
});


app.post('/gps', async (req: Request, res: Response) => {
  const { vehicleId, latitude, longitude, altitude, speed, timestamp } = req.body;

  // Validate required fields
  if (!vehicleId || !latitude || !longitude) {
    return res.status(400).json({ error: 'Missing required fields: vehicleId, latitude, and longitude are required.' });
  }

  try {
    const newGPSData = await prisma.gps.create({
      data: {
        vehicleId,
        latitude,
        longitude,
        altitude: altitude || null,
        speed: speed || null,
        timestamp: timestamp ? new Date(timestamp) : undefined,  // If timestamp is provided, convert it to Date
      },
    });
    res.status(201).json(newGPSData);
  } catch (error) {
    res.status(500).json({ error: 'Error creating GPS data', details: error });
  }
});

app.post('/obd_fuel', async (req, res) => {
  try {
    const {
      vehicle_id,
      engineRpm,
      fuelLevel,
      engineLoad,
      massAirFlow,
      fuelPressure,
      fuelConsumptionRate,
      diagnosticTroubleCode,
      absStatus,
      tirePressure,
      distanceTraveled,
      time
    } = req.body;

    const newFuelMetrics = await prisma.obd_fuel.create({
      data: {
        vehicle_id,
        engineRpm,
        fuelLevel,
        engineLoad,
        massAirFlow,
        fuelPressure,
        fuelConsumptionRate,
        diagnosticTroubleCode,
        absStatus,
        tirePressure,
        distanceTraveled,
        time: time ? new Date(time) : undefined // Optional time, use current if not provided
      }
    });

    res.status(201).json(newFuelMetrics);
  } catch (error) {
    res.status(500).json({ error: 'Error creating OBD fuel metrics', details: error });
  }
});

app.post('/test', async (req, res) => {
  try {
      // Save the entire JSON object from the request body
      const jsonData = req.body;

      // Ensure jsonData is not empty
      if (!jsonData) {
          return res.status(400).json({ message: 'No data provided' });
      }

      // Create a new record in the database
      const newRecord = await prisma.obd_check.create({
          data: {
              all: jsonData,
          },
      });

      res.status(201).json(newRecord);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/test', async (req, res) => {
  try {
      const records = await prisma.obd_check.findMany();
      res.status(200).json(records);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
  
});

app.get('/test/latest', async (req, res) => {
  try {
      const latestRecord = await prisma.obd_check.findFirst({
          orderBy: {
              createdAt: 'desc',
          },
      });

      if (!latestRecord) {
          return res.status(404).json({ message: 'No records found' });
      }

      res.status(200).json(latestRecord);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
