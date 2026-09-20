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
install -Dpm 0644 packaging/lib/systemd/system/monitoredu.service %{buildroot}/usr/lib/systemd/system/monitoredu.service

# Autostart da sessão do aluno
install -Dpm 0644 %{_sourcedir}/packaging/etc/xdg/autostart/%{name}-session.desktop %{buildroot}%{_sysconfdir}/xdg/autostart/%{name}-session.desktop

# Arquivo de configuração
install -Dpm 0666 %{_sourcedir}/packaging/etc/monitoredu/config.json %{buildroot}%{_sysconfdir}/%{name}/config.json

%post
%systemd_post %{name}.service
# Em instalação nova (não em upgrade), inicia o serviço imediatamente
# para o usuário não precisar rodar "systemctl start" na mão.
if [ $1 -eq 1 ]; then
    systemctl start %{name}.service >/dev/null 2>&1 || :
fi

%preun
%systemd_preun %{name}.service
pkill -f %{name}-session >/dev/null 2>&1 || true

%postun
%systemd_postun_with_restart %{name}.service

%files
%{_bindir}/%{name}
%{_bindir}/%{name}-session
%{_unitdir}/%{name}.service
%{_sysconfdir}/xdg/autostart/%{name}-session.desktop
%dir %{_sysconfdir}/%{name}
%config(noreplace) %attr(0666, root, root) %{_sysconfdir}/%{name}/config.json

%changelog
* Sun Sep 20 2026 Vinicius Angelus <monitoredu@monitoraedu.vercel.app> - 0.2.0-1
- Serviço agora inicia automaticamente na instalação (systemctl start no %post)
* Fri Sep 18 2026 Vinicius Angelus <monitoredu@monitoraedu.vercel.app> - 0.2.0-1
- Versão inicial empacotada para Fedora/RHEL
