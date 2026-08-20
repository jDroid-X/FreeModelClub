
/**
 * themeRoutes.js
 * Purpose: Expose CRUD API for theme management.
 */

const express = require('express');
const router = express.Router();
const ThemeController = require('../controllers/ThemeController');

// GET all themes
router.get('/', ThemeController.getAllThemes ? ThemeController.getAllThemes : ThemeController.getAll);
// GET a single theme by id
router.get('/:id', ThemeController.getThemeById ? ThemeController.getThemeById : ThemeController.get);
// POST create new theme
router.post('/', ThemeController.createTheme ? ThemeController.createTheme : ThemeController.create);
// PUT update theme
router.put('/:id', ThemeController.updateTheme ? ThemeController.updateTheme : ThemeController.update);
// DELETE theme
router.delete('/:id', ThemeController.deleteTheme ? ThemeController.deleteTheme : ThemeController.delete);

module.exports = router;
