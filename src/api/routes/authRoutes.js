const express = require("express");
const router = express.Router();
const { authService } = require("../../services/authService");

router.post("/auth", async (req, res) => {
  const { username, password, hostname, protocol } = req.body;

  try {
    const result = await authService(username, password, hostname, protocol);
    res.header("Content-Type", "application/json");
    res.send(
      JSON.stringify(
        {
          success: true,
          message: "Authentication successful",
          details: result,
          username: username,
          hostname: hostname,
        },
        null,
        4
      ) + "\n"
    );
  } catch (error) {
    res
      .status(401)
      .header("Content-Type", "application/json")
      .send(
        JSON.stringify(
          {
            success: false,
            message: "Authentication failed",
            error: error.message,
            username: username,
            hostname: hostname,
          },
          null,
          4
        ) + "\n"
      );
  }
});

module.exports = router;
