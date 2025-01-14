const router = require("express").Router();
const { Mood, User, Activity, AUM } = require("../models");
const Op = require("sequelize").Op;
const withAuth = require("../utils/auth");

router.get("/", async (req, res) => {
  res.render("loginPage", { loggedIn: req.session.loggedIn });
});

router.get("/signup", async (req, res) => {
  res.render("signupPage", { loggedIn: req.session.loggedIn });
});

router.get("/contact-us", async (req, res) => {
  res.render("contact-us", { loggedIn: req.session.loggedIn });
});

router.get("/dashboard", async (req, res) => {
  try {
    if (!req.session.loggedIn) {
      res.render("loginPage");
    } else {
      const moodData = await Mood.findAll({
        attributes: ["name", "id", "description"],
      });
      const communityPost = await AUM.findAll({
        order: [["date_time", "DESC"]],
        limit: 5,
        include: [
          { model: User, attributes: ["username"] },
          { model: Mood, attributes: ["name"] },
          { model: Activity, attributes: ["title", "description"] },
        ],
      });

      const posts = communityPost.map((post) => post.get({ plain: true }));
      // console.log(posts);
      const userData = await User.findByPk(req.session.user_id);

      const user = userData.get({ plain: true });

      if (!moodData) {
        res.status(400).json({ message: "ERROR" });
      }
      const moods = await moodData.map((mood) => mood.get({ plain: true }));
      res.render("dashboard", {
        moods,
        user,
        loggedIn: req.session.loggedIn,
        userId: req.session.user_id,
        resultPending: req.session.resultPending,
        posts,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.get("/addActivity", withAuth, async (req, res) => {
  try {
    const activityData = await Activity.findAll();

    const userData = await User.findByPk(req.session.user_id);

    const activities = await activityData.map((act) =>
      act.get({ plain: true })
    );

    const user = userData.get({ plain: true });

    res.render("addActivity", {
      user,
      activities,
      loggedIn: req.session.loggedIn,
    });
  } catch (err) {
    console.log(err);
  }
});

// *********************  TEST ROUTES FOR DB DEV  ************************ //

// GETS a user with their activities and moods, this is where you use req.params
router.get("/test/user/:id", async (req, res) => {
  try {
    const userData = await User.findByPk(req.params.id, {
      include: [
        {
          model: AUM,
          attributes: ["id"],
          include: [
            { model: Mood, attributes: ["name"] },
            { model: Activity, attributes: ["title"] },
          ],
        },
      ],
    });

    if (!userData) {
      res.status(400).json({ message: "ERROR" });
    }

    res.status(200).json(userData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GETS moods with their activities and if the experience was positive or not
router.get("/test/mood/activity", async (req, res) => {
  try {
    const aumData = await Mood.findAll({
      attributes: ["name"],
      include: [
        {
          model: AUM,
          attributes: ["user_id", "result"],
          include: [{ model: Activity, attributes: ["title"] }],
        },
      ],
    });

    if (!aumData) {
      res.status(400).json({ message: "ERROR" });
    }

    res.status(200).json(aumData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GETS the number of times a certain activity was beneficial for a certain mood
router.get("/test/count/:mood_id/:activity_id", async (req, res) => {
  try {
    const aumData = await AUM.sum("result", {
      where: {
        mood_id: req.params.mood,
        activity_id: req.params.activity,
      },
    });

    if (!aumData) {
      res.status(400).json({ message: "ERROR" });
    }

    res.status(200).json(aumData);
  } catch (err) {
    res.status(500).json(err);
  }
});
// TEST for by Mood
router.get("/test/mood/:id", async (req, res) => {
  try {
    const aumData = await AUM.findAll({
      group: "activity_id",
      where: {
        mood_id: req.params.id,
        result: true,
      },
      include: [{ model: Activity }],
    });

    if (!aumData) {
      res.status(400).json({ message: "ERROR" });
    }

    res.status(200).json(aumData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// *********************  END TEST ROUTES  ************************ //

module.exports = router;
