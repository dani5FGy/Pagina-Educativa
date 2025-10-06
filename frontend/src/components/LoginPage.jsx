import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Link,
  Alert,
  CircularProgress,
  Avatar,
  Container,
  Fade,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  FlashOn,
  ArrowBack,
  Visibility,
  VisibilityOff,
  Person,
  PersonAdd,
  PlayArrow,
  Info
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [screen, setScreen] = useState('main'); // main, login, register, guest
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    rememberMe: false,
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, loginAsGuest, loading, error, clearError } = useAuth();

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) clearError();
  };
 

  const handleCheckboxChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };
  

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!formData.email || !formData.password) {
      return;
    }

    try {
      await login(formData.email, formData.password);
    } catch (error) {
      // Error manejado por el contexto
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    if (!formData.acceptTerms) {
      return;
    }

    try {
      await register(formData.name, formData.email, formData.password);
    } catch (error) {
      // Error manejado por el contexto
    }
  };

  const handleGuestLogin = async (event) => {
    event.preventDefault();
    
    if (!formData.username || formData.username.trim().length < 2) {
      return;
    }

    try {
      await loginAsGuest(formData.username);
    } catch (error) {
      // Error manejado por el contexto
    }
  };

  const goBack = () => {
    setScreen('main');
    clearError();
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      rememberMe: false,
      acceptTerms: false
    });
  };

    const renderLogo = () => (
    <Box textAlign="center" mb={3}>
      <Avatar
        sx={{
          width: 64,
          height: 64,
          mx: "auto",
          mb: 2,
          background: "linear-gradient(45deg, #FCD34D, #F59E0B)",
        }}
      >
        <FlashOn sx={{ fontSize: 32, color: "white" }} />
      </Avatar>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          background: "linear-gradient(45deg, #FCD34D, #F59E0B)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        MaxWaveX
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Bienvenido a la plataforma de electromagnetismo
      </Typography>
    </Box>
  );

  // Pantalla Principal
  const MainScreen = () => (
    <Fade in timeout={500}>
      <Box>
        {renderLogo()}

        {error && (
          <Fade in>
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={clearError}
            >
              {error}
            </Alert>
          </Fade>
        )}

        <Box display="flex" flexDirection="column" gap={2}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<Person />}
            onClick={() => setScreen('login')}
            sx={{
              color: 'white',
              py: 2,
              background: 'linear-gradient(90deg, #2563EB 0%, #8B5CF6 100%)',
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(90deg, #1D4ED8 0%, #7C3AED 100%)',
              },
            }}
          >
            Iniciar Sesión
          </Button>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<PersonAdd />}
            onClick={() => setScreen('register')}
            sx={{
              color: 'white',
              py: 2,
              background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)',
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(90deg, #047857 0%, #059669 100%)',
              },
            }}
          >
            Registrarse
          </Button>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            onClick={() => setScreen('guest')}
            sx={{
              color: 'white',
              py: 2,
              background: 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)',
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(90deg, #B45309 0%, #D97706 100%)',
              },
            }}
          >
            Continuar como Invitado
          </Button>
        </Box>
      </Box>
    </Fade>
  );

  // Pantalla de Login
  const LoginScreen = () => (
    <Fade in timeout={500}>
      <Box>
        {renderLogo()}

        <Typography
          variant="h5"
          textAlign="center"
          gutterBottom
          sx={{ color: '#FCD34D', fontWeight: 600, mb: 1 }}
        >
          Iniciar Sesión
        </Typography>
        <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
          Accede a tu cuenta existente
        </Typography>

        {error && (
          <Fade in>
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={clearError}
            >
              {error}
            </Alert>
          </Fade>
        )}

        <Box component="form" onSubmit={handleLogin} noValidate>
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Email o Usuario
            </Typography>
            <TextField
              fullWidth
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              required
              placeholder="tu@email.com"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            />
          </Box>

          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Contraseña
            </Typography>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              required
              placeholder="••••••••"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            />
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.rememberMe}
                  onChange={handleCheckboxChange('rememberMe')}
                  size="small"
                />
              }
              label={<Typography variant="body2">Recordarme</Typography>}
            />
            <Link href="#" variant="body2" sx={{ color: '#60A5FA' }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </Box>

          <Box display="flex" flexDirection="column" gap={2}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                color: 'white',
                py: 1.5,
                background: 'linear-gradient(90deg, #2563EB 0%, #8B5CF6 100%)',
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(90deg, #1D4ED8 0%, #7C3AED 100%)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Iniciar Sesión'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              onClick={goBack}
              sx={{
                py: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'text.primary',
                borderRadius: 2,
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              Volver
            </Button>
          </Box>
        </Box>
      </Box>
    </Fade>
  );

  // Pantalla de Registro
  const RegisterScreen = () => (
    <Fade in timeout={500}>
      <Box>
        {renderLogo()}

        <Typography
          variant="h5"
          textAlign="center"
          gutterBottom
          sx={{ color: '#10B981', fontWeight: 600, mb: 1 }}
        >
          Crear Cuenta
        </Typography>
        <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
          Únete a Maxwell Academy
        </Typography>

        {error && (
          <Fade in>
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={clearError}
            >
              {error}
            </Alert>
          </Fade>
        )}

        <Box component="form" onSubmit={handleRegister} noValidate>
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Nombre Completo
            </Typography>
            <TextField
              fullWidth
              value={formData.name}
              onChange={handleInputChange('name')}
              required
              placeholder="Tu nombre completo"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            />
          </Box>

          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Email
            </Typography>
            <TextField
              fullWidth
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              required
              placeholder="tu@email.com"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            />
          </Box>

          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Contraseña
            </Typography>
            <TextField
              fullWidth
              type="password"
              value={formData.password}
              onChange={handleInputChange('password')}
              required
              placeholder="••••••••"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            />
          </Box>

          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Confirmar Contraseña
            </Typography>
            <TextField
              fullWidth
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              required
              error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
              placeholder="••••••••"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            />
          </Box>

          <Box mb={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.acceptTerms}
                  onChange={handleCheckboxChange('acceptTerms')}
                  required
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  Acepto los{' '}
                  <Link href="#" sx={{ color: '#10B981' }}>
                    términos y condiciones
                  </Link>
                </Typography>
              }
            />
          </Box>

          <Box display="flex" flexDirection="column" gap={2}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                color: 'white',
                py: 1.5,
                background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)',
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(90deg, #047857 0%, #059669 100%)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Crear Cuenta'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              onClick={goBack}
              sx={{
                py: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'text.primary',
                borderRadius: 2,
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              Volver
            </Button>
          </Box>
        </Box>
      </Box>
    </Fade>
  );

  // Pantalla de Invitado
  const GuestScreen = () => (
    <Fade in timeout={500}>
      <Box>
        {renderLogo()}

        <Typography
          variant="h5"
          textAlign="center"
          gutterBottom
          sx={{ color: '#F59E0B', fontWeight: 600, mb: 1 }}
        >
          Acceso como Invitado
        </Typography>
        <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
          Explora Maxwell Academy sin crear cuenta
        </Typography>

        {error && (
          <Fade in>
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={clearError}
            >
              {error}
            </Alert>
          </Fade>
        )}

        <Box component="form" onSubmit={handleGuestLogin} noValidate>
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Nombre de Usuario
            </Typography>
            <TextField
              fullWidth
              value={formData.username}
              onChange={handleInputChange('username')}
              required
              placeholder="Elige un nombre de usuario"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Este nombre se usará para personalizar tu experiencia
            </Typography>
          </Box>

          <Alert
            severity="info"
            icon={<Info />}
            sx={{
              mb: 3,
              backgroundColor: 'rgba(217, 119, 6, 0.1)',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              borderRadius: 2,
              '& .MuiAlert-icon': {
                color: '#F59E0B'
              }
            }}
          >
            <Typography variant="subtitle2" sx={{ color: '#FCD34D', mb: 1, fontWeight: 600 }}>
              Modo Invitado
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              • Acceso completo a todos los módulos<br />
              • El progreso no se guardará<br />
              • Puedes crear una cuenta más tarde
            </Typography>
          </Alert>

          <Box display="flex" flexDirection="column" gap={2}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                color: 'white',
                py: 1.5,
                background: 'linear-gradient(90deg, #D97706 0%, #F59E0B 100%)',
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  background: 'linear-gradient(90deg, #B45309 0%, #D97706 100%)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Continuar como Invitado'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              onClick={goBack}
              sx={{
                py: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'text.primary',
                borderRadius: 2,
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              Volver
            </Button>
          </Box>
        </Box>
      </Box>
    </Fade>
  );

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        py={4}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 480,
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {screen === 'main' && <MainScreen />}
            {screen === 'login' && <LoginScreen />}
            {screen === 'register' && <RegisterScreen />}
            {screen === 'guest' && <GuestScreen />}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default LoginPage;