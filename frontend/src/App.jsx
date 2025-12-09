import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Snackbar,
  Alert,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  AppBar,
  CssBaseline,
  TextField,
  Button,
  Paper,
  CircularProgress,
} from "@mui/material";

import SmartphoneIcon from "@mui/icons-material/Smartphone";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import HandshakeIcon from "@mui/icons-material/Handshake";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LockResetIcon from "@mui/icons-material/LockReset";
import SettingsIcon from "@mui/icons-material/Settings";

const drawerWidth = 260;

// URL base do backend (configurável via Vite)
// no Mac: export VITE_API_BASE_URL="http://localhost:8000"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Opções de módulo para troca de senha
const passwordOptions = [
  {
    id: "app",
    label: "Aplicativo",
    description: "Acesse o módulo voltado para o aplicativo mobile.",
    icon: SmartphoneIcon,
  },
  {
    id: "corporate",
    label: "Corporativo",
    description: "Área corporativa, gestão interna e operações.",
    icon: BusinessCenterIcon,
  },
  {
    id: "partners",
    label: "Parcerias",
    description: "Gestão de parcerias, integrações e acordos.",
    icon: HandshakeIcon,
  },
];

// Tela de escolha do módulo (App / Corporativo / Parcerias)
function PasswordModuleSelection({ selectedOption, onOptionClick }) {
  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        background: "radial-gradient(circle at top, #e3f2fd, #f4f6f8)",
      }}
    >
      <Container maxWidth="md">
        <Box textAlign="center" mb={6}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Troca de senha
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Permite trocar a senha de acesso do usuário.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {passwordOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedOption === option.id;

            return (
              <Grid item xs={12} sm={4} key={option.id}>
                <Card
                  elevation={isSelected ? 8 : 2}
                  sx={{
                    height: 230,
                    borderRadius: 4,
                    border: isSelected
                      ? (theme) => `2px solid ${theme.palette.primary.main}`
                      : "2px solid transparent",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 10,
                    },
                  }}
                >
                  <CardActionArea
                    sx={{ height: "100%" }}
                    onClick={() => onOptionClick(option)}
                  >
                    <CardContent>
                      <Stack
                        direction="column"
                        spacing={2}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Box
                          sx={{
                            width: 72,
                            height: 72,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: (theme) =>
                              isSelected
                                ? theme.palette.primary.main
                                : theme.palette.background.paper,
                            color: (theme) =>
                              isSelected
                                ? theme.palette.primary.contrastText
                                : theme.palette.primary.main,
                            boxShadow: 2,
                          }}
                        >
                          <Icon sx={{ fontSize: 40 }} />
                        </Box>
                        <Typography
                          variant="h6"
                          component="h2"
                          fontWeight={600}
                          align="center"
                        >
                          {option.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="center"
                        >
                          {option.description}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}

// Tela de CPF para o módulo "Aplicativo"
function AppPasswordCpfForm({
  loading,
  error,
  userData,
  onBack,
  onSubmitCpf,
  application,
}) {
  const [cpf, setCpf] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeResult, setChangeResult] = useState(null);

  // 🔹 Função para formatar CPF enquanto digita
  function formatCpf(value) {
    const onlyNums = value.replace(/[^\d]/g, "");

    if (onlyNums.length <= 3) return onlyNums;
    if (onlyNums.length <= 6)
      return `${onlyNums.slice(0, 3)}.${onlyNums.slice(3)}`;
    if (onlyNums.length <= 9)
      return `${onlyNums.slice(0, 3)}.${onlyNums.slice(3, 6)}.${onlyNums.slice(
        6
      )}`;
    return `${onlyNums.slice(0, 3)}.${onlyNums.slice(
      3,
      6
    )}.${onlyNums.slice(6, 9)}-${onlyNums.slice(9, 11)}`;
  }

  const handleCpfChange = (e) => {
    const raw = e.target.value;
    const masked = formatCpf(raw);
    setCpf(masked);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // 🔹 Remove máscara e envia só números
    const cleanedCpf = cpf.replace(/[^\d]/g, "");

    if (cleanedCpf.length !== 11) {
      alert("CPF deve ter 11 dígitos.");
      return;
    }
    setChangeResult(null);

    await onSubmitCpf(cleanedCpf);
  };
  const handleChangePasswordClick = async () => {
    if (!userData) {
      alert("Busque primeiro os dados do usuário pelo CPF antes de trocar a senha.");
      return;
    }

    const cleanedCpf = cpf.replace(/[^\d]/g, "");
    if (cleanedCpf.length !== 11) {
      alert("CPF inválido. Verifique e tente novamente.");
      return;
    }
    const appName = application || "app";

    const confirmed = window.confirm(
      `Atenção! Você está alterando a senha em PRODUÇÃO.\n\n` +
        `Aplicação selecionada: ${appName.toUpperCase()}.\n\n` +
        `Confirme se os dados do usuário (nome, email, CPF) estão corretos antes de continuar.\n\n` +
        `Deseja realmente prosseguir com a troca de senha?`
    );

    if (!confirmed) return;

    const payload = {
      cpf: cleanedCpf,
      change_pass: "yes",
      application: appName,
    };

    try {
      setChangeLoading(true);

      const response = await fetch(`${API_BASE_URL}/users/${cleanedCpf}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Erro ao solicitar troca de senha.";

        try {
          const errData = await response.json();
          message =
            errData?.detail ||
            errData?.message ||
            JSON.stringify(errData) ||
            message;
        } catch {
          try {
            const text = await response.text();
            if (text) message = text;
          } catch {
            /* ignore */
          }
        }

        alert(message);
        return;
      }

      let data = null;
      try {
        data = await response.json();
      } catch {
        // se o backend não devolver JSON, segue mesmo assim
      }

      console.log("Resposta troca de senha:", data);
      setChangeResult(data); 
    } catch (err) {
      console.error(err);
      alert("Erro de comunicação com o servidor. Tente novamente.");
    } finally {
      setChangeLoading(false);
    }
  };
  const handleCopyPassword = async () => {
    if (!changeResult?.new_password) return;
    try {
      await navigator.clipboard.writeText(changeResult.new_password);
      alert("Senha copiada para a área de transferência.");
    } catch (err) {
      console.error(err);
      alert("Não foi possível copiar a senha. Copie manualmente.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f4f6f8",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 4, boxShadow: 4 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Troca de senha - Aplicativo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Informe o CPF do usuário. Os dados serão consultados no backend
                (Cognito) para continuar o fluxo de troca de senha.
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="CPF"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  fullWidth
                  inputProps={{ maxLength: 14 }}
                />

                {error && <Alert severity="error">{error}</Alert>}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button variant="outlined" onClick={onBack}>
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} /> : null}
                  >
                    {loading ? "Consultando..." : "Buscar Usuário"}
                  </Button>
                </Stack>
              </Stack>
            </form>
            {userData && (
              <Box mt={3}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Dados do usuário (Cognito)
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="Usuário"
                    value={userData.username || ""}
                    fullWidth
                    disabled
                  />

                  <TextField
                    label="Nome"
                    value={userData.user_attributes?.nickname || ""}
                    fullWidth
                    disabled
                  />

                  <TextField
                    label="Email"
                    value={userData.user_attributes?.email || ""}
                    fullWidth
                    disabled
                  />

                  <TextField
                    label="Telefone"
                    value={userData.user_attributes?.phone_number || ""}
                    fullWidth
                    disabled
                  />

                  <TextField
                    label="Data de nascimento"
                    value={userData.user_attributes?.birthdate || ""}
                    fullWidth
                    disabled
                  />

                  <TextField
                    label="Status"
                    value={userData.user_status || ""}
                    fullWidth
                    disabled
                  />

                  <TextField
                    label="Sub"
                    value={userData.user_attributes?.sub || ""}
                    fullWidth
                    disabled
                  />
                  {/* Botão vermelho "Trocar senha" só aparece quando userData existe */}
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleChangePasswordClick}
                      disabled={changeLoading}
                    >
                      {changeLoading ? "Enviando..." : "Trocar senha"}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            )}
            {changeResult && (
              <Box mt={3}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  {changeResult.message || "Senha alterada com sucesso no Cognito."}
                </Alert>
                <Stack spacing={2} alignItems="center">
                  <TextField
                    label="Nova senha"
                    type="password"
                    value={changeResult.new_password || ""}
                    fullWidth
                    disabled
                  />

                  <Box display="flex" justifyContent="center">
                    <Button variant="outlined" onClick={handleCopyPassword}>
                      Copiar senha
                    </Button>
                  </Box>
                  
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    Copie a senha pois ela não será mais revelada no futuro, e
                    peça ao usuário para trocá-la no primeiro login.
                  </Typography>
                </Stack>
              </Box>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

// Wrapper da área de troca de senha (decide qual “subtela” renderizar)
function PasswordChangeScreen({
  step,
  selectedOption,
  onOptionClick,
  onBackToOptions,
  apiLoading,
  apiError,
  userData,
  onCpfSubmit,
  snackbar,
  onCloseSnackbar,
}) {
  const content =
    step === "cpf-app" && selectedOption === "app" ? (
      <AppPasswordCpfForm
        loading={apiLoading}
        error={apiError}
        userData={userData}
        onBack={onBackToOptions}
        onSubmitCpf={onCpfSubmit}
        application={selectedOption}
      />
    ) : (
      <PasswordModuleSelection
        selectedOption={selectedOption}
        onOptionClick={onOptionClick}
      />
    );

  return (
    <>
      {content}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={onCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={onCloseSnackbar}
          severity={apiError ? "error" : "info"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

// Conteúdo placeholder para outras telas do menu
function PlaceholderScreen({ title }) {
  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f4f6f8",
        textAlign: "center",
      }}
    >
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {title}
        </Typography>
        <Typography color="text.secondary">
          Aqui você pode colocar o conteúdo da tela <strong>{title}</strong>.
        </Typography>
      </Box>
    </Box>
  );
}

export default function App() {
  const [menuSelected, setMenuSelected] = useState("dashboard");
  const [passwordStep, setPasswordStep] = useState("select-module"); // "select-module" | "cpf-app"
  const [selectedPasswordOption, setSelectedPasswordOption] = useState(null);

  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [userData, setUserData] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
  });

  const handleMenuClick = (id) => {
    setMenuSelected(id);
    // reset fluxo de senha ao sair
    if (id !== "change-password") {
      setPasswordStep("select-module");
      setSelectedPasswordOption(null);
      setUserData(null);
      setApiError(null);
    }
  };

  const handlePasswordOptionClick = (option) => {
    setSelectedPasswordOption(option.id);

    if (option.id === "app") {
      // vai para tela de CPF
      setPasswordStep("cpf-app");
      setSnackbar({
        open: true,
        message: `Módulo selecionado: ${option.label}`,
      });
    } else {
      // para os outros módulos você pode criar fluxos semelhantes depois
      setSnackbar({
        open: true,
        message: `Módulo ${option.label} ainda não implementado.`,
      });
    }
  };

  const handleBackToOptions = () => {
    setPasswordStep("select-module");
    setSelectedPasswordOption(null);
    setUserData(null);
    setApiError(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleCpfSubmit = async (cpf) => {
    try {
      setApiLoading(true);
      setApiError(null);
      setUserData(null);

      const application = selectedPasswordOption || "app";

      // monta URL tipo: http://localhost:8000/users/00062716506
      const response = await fetch(
        `${API_BASE_URL}/users/${cpf}?application=${encodeURIComponent(application)}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar dados do usuário no backend.");
      }

      const data = await response.json();
      setUserData(data);

      setSnackbar({
        open: true,
        message: "Dados do usuário carregados com sucesso.",
      });
    } catch (err) {
      console.error(err);
      setApiError(err.message || "Erro desconhecido.");
      setSnackbar({
        open: true,
        message: "Erro ao carregar dados do usuário.",
      });
    } finally {
      setApiLoading(false);
    }
  };

  // Decide conteúdo principal
  const renderContent = () => {
    switch (menuSelected) {
      case "change-password":
        return (
          <PasswordChangeScreen
            step={passwordStep}
            selectedOption={selectedPasswordOption}
            onOptionClick={handlePasswordOptionClick}
            onBackToOptions={handleBackToOptions}
            apiLoading={apiLoading}
            apiError={apiError}
            userData={userData}
            onCpfSubmit={handleCpfSubmit}
            snackbar={snackbar}
            onCloseSnackbar={handleCloseSnackbar}
          />
        );
      case "dashboard":
        return <PlaceholderScreen title="Dashboard" />;
      case "reports":
        return <PlaceholderScreen title="Relatórios" />;
      case "settings":
        return <PlaceholderScreen title="Configurações" />;
      default:
        return <PlaceholderScreen title="Página" />;
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Portal Administrativo
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Menu lateral */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: "auto" }}>
          <List>
            <ListItemButton
              selected={menuSelected === "dashboard"}
              onClick={() => handleMenuClick("dashboard")}
            >
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>

            <ListItemButton
              selected={menuSelected === "reports"}
              onClick={() => handleMenuClick("reports")}
            >
              <ListItemIcon>
                <AssessmentIcon />
              </ListItemIcon>
              <ListItemText primary="Relatórios" />
            </ListItemButton>

            <ListItemButton
              selected={menuSelected === "change-password"}
              onClick={() => handleMenuClick("change-password")}
            >
              <ListItemIcon>
                <LockResetIcon />
              </ListItemIcon>
              <ListItemText primary="Troca de Senha" />
            </ListItemButton>

            <ListItemButton
              selected={menuSelected === "settings"}
              onClick={() => handleMenuClick("settings")}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Configurações" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${drawerWidth}px`,
        }}
      >
        <Toolbar />
        {renderContent()}
      </Box>
    </Box>
  );
}
