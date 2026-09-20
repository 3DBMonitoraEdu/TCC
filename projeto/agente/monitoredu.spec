%global _buildsubdir %{nil}
%{!?version: %define version 0.2.0}


Name:           monitoredu
Version:        %{version}
Release:        1%{?dist}
Summary:        Agente MoniTec / MonitorEdu

License:        GPL-3.0-only
URL:            https://monitoraedu.vercel.app

Requires:       systemd
Requires:       iproute

%description
O agente é o componente periférico do MoniTec, executado em segundo
plano nos PCs dos alunos para coleta de métricas e suporte local.

%install
# Binários pré-compilados pelo build-rpm.sh
install -Dpm 0755 %{_sourcedir}/dist/%{name} %{buildroot}%{_bindir}/%{name}
install -Dpm 0755 %{_sourcedir}/dist/%{name}-session %{buildroot}%{_bindir}/%{name}-session

# Serviço Systemd
install -Dpm 0644 %{_sourcedir}/packaging/lib/systemd/system/monitoredu.service %{buildroot}/usr/lib/systemd/system/monitoredu.service

# Autostart da sessão do aluno
install -Dpm 0644 %{_sourcedir}/packaging/etc/xdg/autostart/%{name}-session.desktop %{buildroot}%{_sysconfdir}/xdg/autostart/%{name}-session.desktop

# Arquivo de configuração
install -Dpm 0666 %{_sourcedir}/packaging/etc/monitoredu/config.json %{buildroot}%{_sysconfdir}/%{name}/config.json

%files
%{_bindir}/%{name}
%{_bindir}/%{name}-session
/usr/lib/systemd/system/%{name}.service
%{_sysconfdir}/xdg/autostart/%{name}-session.desktop
%dir %{_sysconfdir}/%{name}
%config(noreplace) %attr(0666, root, root) %{_sysconfdir}/%{name}/config.json

%post
systemctl daemon-reload >/dev/null 2>&1 || :
if [ $1 -eq 1 ]; then
    systemctl enable %{name}.service >/dev/null 2>&1 || :
    systemctl start %{name}.service >/dev/null 2>&1 || :
fi

%preun
if [ $1 -eq 0 ]; then
    systemctl stop %{name}.service >/dev/null 2>&1 || :
    systemctl disable %{name}.service >/dev/null 2>&1 || :
fi
pkill -f %{name}-session >/dev/null 2>&1 || true

%postun
systemctl daemon-reload >/dev/null 2>&1 || :
if [ $1 -ge 1 ]; then
    systemctl try-restart %{name}.service >/dev/null 2>&1 || :
fi
